import { useState } from 'react';

export default function ControlPanel({ onShareStart, onShareStop, isSharing }) {
  const [isMicOn, setIsMicOn] = useState(true);

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    // In a real app, you would mute/unmute the audio tracks here
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: '15px',
      borderRadius: '20px',
      display: 'flex',
      gap: '10px',
      zIndex: 1000,
      backdropFilter: 'blur(10px)'
    }}>
      {!isSharing ? (
        <button
          onClick={onShareStart}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Start Sharing Screen
        </button>
      ) : (
        <>
          <button
            onClick={toggleMic}
            style={{
              padding: '10px',
              backgroundColor: isMicOn ? '#0070f3' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {isMicOn ? '🎤 Mic On' : '🔇 Mic Off'}
          </button>
          <button
            onClick={onShareStop}
            style={{
              padding: '10px',
              backgroundColor: 'red',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Stop Sharing
          </button>
        </>
      )}
    </div>
  );
}