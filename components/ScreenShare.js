import { useEffect, useRef, useState } from 'react';

export default function ScreenShare({ 
  onStreamReady, 
  onStreamEnd, 
  audioEnabled = true,
  peerConnection = null,
  userId = null
}) {
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    // Auto-start sharing when component mounts
    startScreenShare();
    
    return () => {
      stopScreenShare();
    };
  }, []);

  const startScreenShare = async () => {
    try {
      console.log('Starting screen share...');
      
      // Get screen share with audio
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          frameRate: 30,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: audioEnabled
      });

      console.log('Got screen stream, adding tracks to peer connection');
      
      // If peer connection is provided, add tracks to it
      if (peerConnection) {
        screenStream.getTracks().forEach(track => {
          console.log(`Adding track ${track.kind} to peer connection`);
          peerConnection.addTrack(track, screenStream);
        });
      }

      streamRef.current = screenStream;
      setIsSharing(true);
      
      // Notify parent component
      if (onStreamReady) {
        onStreamReady(screenStream);
      }

      // Handle when user stops sharing via browser UI
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('User stopped sharing via browser');
        stopScreenShare();
      });

      console.log('Screen share started successfully');

    } catch (error) {
      console.error('Error starting screen share:', error);
      if (onStreamEnd) {
        onStreamEnd();
      }
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
    
    setIsSharing(false);
    
    // Notify parent
    if (onStreamEnd) {
      onStreamEnd();
    }
  };

  return (
    <div>
      {isSharing && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '20px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          🟢 Sharing screen to others
        </div>
      )}
    </div>
  );
}
