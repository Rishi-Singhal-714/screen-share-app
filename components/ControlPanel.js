import { useState, useEffect } from 'react';

export default function ControlPanel({ onShareStart, onShareStop, isSharing }) {
  const [isMicOn, setIsMicOn] = useState(true);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        if (isSharing) {
          onShareStop();
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        setIsMicOn(!isMicOn);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isSharing, isMicOn]);

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    // In a real app, you would mute/unmute the audio tracks here
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(40, 40, 40, 0.9)',
      padding: '15px 25px',
      borderRadius: '25px',
      display: 'flex',
      gap: '15px',
      zIndex: 999,
      backdropFilter: 'blur(10px)',
      border: '1px solid #444',
      boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
    }}>
      {!isSharing ? (
        <button
          onClick={onShareStart}
          style={{
            padding: '12px 25px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
        >
          <span>📺</span> Start Sharing Screen
        </button>
      ) : (
        <>
          <button
            onClick={toggleMic}
            style={{
              padding: '12px 20px',
              backgroundColor: isMicOn ? '#2196F3' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '120px'
            }}
            title="Press M to toggle mic"
          >
            <span>{isMicOn ? '🎤' : '🔇'}</span>
            {isMicOn ? 'Mic ON' : 'Mic OFF'}
          </button>
          <button
            onClick={onShareStop}
            style={{
              padding: '12px 20px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            title="Press ESC to stop sharing"
          >
            <span>⏹️</span> Stop Sharing
          </button>
        </>
      )}
    </div>
  );
}
