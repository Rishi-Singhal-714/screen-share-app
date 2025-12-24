import { useEffect, useRef } from 'react';

export default function ScreenShare({ onStreamReady, onStreamEnd }) {
  const streamRef = useRef(null);

  useEffect(() => {
    const startSharing = async () => {
      try {
        // Get screen share with audio
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });

        // Get microphone audio
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });

        // Combine screen and microphone audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const destination = audioContext.createMediaStreamDestination();
        
        // Add screen audio (if any)
        const screenAudio = audioContext.createMediaStreamSource(
          new MediaStream(stream.getAudioTracks())
        );
        screenAudio.connect(destination);
        
        // Add microphone audio
        const micAudio = audioContext.createMediaStreamSource(micStream);
        micAudio.connect(destination);
        
        // Get screen video
        const screenVideo = stream.getVideoTracks()[0];
        
        // Create final combined stream
        const combinedStream = new MediaStream([
          screenVideo,
          ...destination.stream.getAudioTracks()
        ]);

        streamRef.current = combinedStream;
        onStreamReady(combinedStream);

        // Handle when user stops sharing
        stream.getVideoTracks()[0].onended = () => {
          stopSharing();
        };

      } catch (err) {
        console.error('Error sharing screen:', err);
        onStreamEnd();
      }
    };

    startSharing();

    return () => {
      stopSharing();
    };
  }, []);

  const stopSharing = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    onStreamEnd();
  };

  return null; // This component doesn't render anything
}