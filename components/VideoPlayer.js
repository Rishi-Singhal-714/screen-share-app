import { useEffect, useRef } from 'react';

export default function VideoPlayer({ stream, isFullscreen, onExit, streamId }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      // Try to play the video
      const playVideo = async () => {
        try {
          await videoRef.current.play();
        } catch (err) {
          console.log('Autoplay prevented:', err);
          // Add play button overlay
          const playButton = document.createElement('button');
          playButton.innerHTML = '▶ Play';
          playButton.style.position = 'absolute';
          playButton.style.top = '50%';
          playButton.style.left = '50%';
          playButton.style.transform = 'translate(-50%, -50%)';
          playButton.style.padding = '10px 20px';
          playButton.style.backgroundColor = 'rgba(0,0,0,0.7)';
          playButton.style.color = 'white';
          playButton.style.border = 'none';
          playButton.style.borderRadius = '5px';
          playButton.style.cursor = 'pointer';
          playButton.style.zIndex = '10';
          
          playButton.onclick = async () => {
            try {
              await videoRef.current.play();
              playButton.remove();
            } catch (err) {
              console.log('Still cannot play:', err);
            }
          };
          
          if (videoRef.current.parentNode) {
            videoRef.current.parentNode.style.position = 'relative';
            videoRef.current.parentNode.appendChild(playButton);
          }
        }
      };
      
      playVideo();
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
        id={`video-${streamId}`}
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
            padding: '10px 20px',
            cursor: 'pointer',
            borderRadius: '5px',
            fontWeight: 'bold',
            zIndex: 1001
          }}
        >
          Exit Fullscreen (ESC)
        </button>
      )}
    </div>
  );
}
