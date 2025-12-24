import { useEffect, useRef } from 'react';

export default function VideoPlayer({ stream, isFullscreen, onExit }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{
      width: isFullscreen ? '100%' : '100%',
      height: isFullscreen ? '100%' : '200px',
      backgroundColor: 'black',
      position: 'relative'
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
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
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            border: 'none',
            padding: '10px',
            cursor: 'pointer',
            borderRadius: '5px'
          }}
        >
          Exit Fullscreen
        </button>
      )}
    </div>
  );
}