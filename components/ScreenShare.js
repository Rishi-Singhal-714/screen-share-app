import { useEffect, useRef } from 'react';

export default function ScreenShare({ onStreamReady, onStreamEnd, audioEnabled = true }) {
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    startScreenShare();
    
    // Cleanup function
    return () => {
      stopScreenShare();
    };
  }, []);

  const startScreenShare = async () => {
    try {
      console.log('Starting screen share...');
      
      // First, get screen sharing permission
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: audioEnabled
      });

      console.log('Screen stream obtained');
      
      let finalStream;
      
      if (audioEnabled) {
        // Try to get microphone audio
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          });
          
          // Combine screen and microphone audio
          finalStream = await combineAudioStreams(screenStream, micStream);
        } catch (micError) {
          console.warn('Microphone not available, using screen audio only');
          finalStream = screenStream;
        }
      } else {
        finalStream = screenStream;
      }

      streamRef.current = finalStream;
      
      // Add event listener for when user stops sharing via browser UI
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('User stopped sharing via browser');
        stopScreenShare();
      });

      // Notify parent component that stream is ready
      if (onStreamReady) {
        onStreamReady(finalStream);
      }

      console.log('Screen share started successfully');
      
    } catch (error) {
      console.error('Error starting screen share:', error);
      if (onStreamEnd) {
        onStreamEnd();
      }
    }
  };

  const combineAudioStreams = async (screenStream, micStream) => {
    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const destination = audioContextRef.current.createMediaStreamDestination();
      
      // Check if screen has audio
      const screenAudioTracks = screenStream.getAudioTracks();
      if (screenAudioTracks.length > 0) {
        const screenAudio = audioContextRef.current.createMediaStreamSource(
          new MediaStream(screenAudioTracks)
        );
        screenAudio.connect(destination);
      }
      
      // Add microphone audio
      const micAudio = audioContextRef.current.createMediaStreamSource(micStream);
      micAudio.connect(destination);
      
      // Get video track from screen stream
      const videoTrack = screenStream.getVideoTracks()[0];
      
      // Create final combined stream
      const combinedStream = new MediaStream([
        videoTrack,
        ...destination.stream.getAudioTracks()
      ]);
      
      return combinedStream;
    } catch (error) {
      console.warn('Could not combine audio streams:', error);
      return screenStream; // Fallback to just screen stream
    }
  };

  const stopScreenShare = () => {
    console.log('Stopping screen share...');
    
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Close audio context if it exists
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Notify parent
    if (onStreamEnd) {
      onStreamEnd();
    }
  };

  // Public method to stop sharing (can be called from parent)
  const stopSharing = () => {
    stopScreenShare();
  };

  // Expose stop method to parent (via ref if needed)
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopScreenShare();
    };
  }, []);

  return null; // This component doesn't render anything visible
}

// Utility function to get screen share stream (can be called from anywhere)
export const getScreenShareStream = async (includeAudio = true) => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        frameRate: { ideal: 30, max: 60 },
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 }
      },
      audio: includeAudio
    });
    
    // Handle when user stops sharing via browser
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      console.log('Screen sharing stopped by user');
    });
    
    return stream;
  } catch (error) {
    console.error('Error getting screen share stream:', error);
    throw error;
  }
};
