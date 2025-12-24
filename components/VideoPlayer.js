import { useEffect, useRef } from 'react';

export default function VideoPlayer({ stream, isFullscreen, onExit }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      // Try to autoplay
      videoRef.current.play().catch(err => {
        console.log('Autoplay prevented:', err);
        // Add click-to-play overlay
        const playOverlay = document.createElement('div');
        playOverlay.innerHTML = 'Click to play';
        playOverlay.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          z-index: 10;
        `;
        playOverlay.onclick = () => {
          videoRef.current.play();
          playOverlay.remove();
        };
        videoRef.current.parentNode.appendChild(playOverlay);
      });
    }
  }, [stream]);

  useEffect(() => {
    // Handle ESC key to exit fullscreen
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isFullscreen && onExit) {
        onExit();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen, onExit]);

  return (
    <div style={{
      width: '100%',
      height: isFullscreen ? '100vh' : 'auto',
      backgroundColor: 'black',
      position: 'relative'
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
      
      {isFullscreen && onExit && (
        <button
          onClick={onExit}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: 'rgba(255,0,0,0.7)',
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: '5px',
            cursor: 'pointer',
            zIndex: 100
          }}
        >
          Exit Fullscreen (ESC)
        </button>
      )}
    </div>
  );
}
