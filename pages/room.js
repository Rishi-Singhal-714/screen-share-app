import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const ScreenShare = dynamic(() => import('../components/ScreenShare'), { ssr: false });
const VideoPlayer = dynamic(() => import('../components/VideoPlayer'), { ssr: false });
const ControlPanel = dynamic(() => import('../components/ControlPanel'), { ssr: false });

export default function Room() {
  const [streams, setStreams] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [fullscreenStream, setFullscreenStream] = useState(null);
  const router = useRouter();

  const addStream = (stream) => {
    setStreams(prev => [...prev, { id: Date.now(), stream }]);
  };

  const removeStream = (id) => {
    setStreams(prev => prev.filter(s => s.id !== id));
    if (fullscreenStream?.id === id) {
      setFullscreenStream(null);
    }
  };

  if (typeof window !== 'undefined') {
    // Check for access code in localStorage on client side
    useEffect(() => {
      const hasAccess = localStorage.getItem('hasAccess');
      if (!hasAccess) {
        router.push('/');
      }
    }, []);
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      padding: '20px'
    }}>
      <h1 style={{ color: 'white', marginBottom: '20px' }}>Screen Share Room</h1>
      
      {/* Fullscreen View */}
      {fullscreenStream && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'black',
          zIndex: 1000
        }}>
          <VideoPlayer
            stream={fullscreenStream.stream}
            isFullscreen={true}
            onExit={() => setFullscreenStream(null)}
          />
        </div>
      )}

      {/* Control Panel */}
      <ControlPanel
        onShareStart={() => setIsSharing(true)}
        onShareStop={() => setIsSharing(false)}
        isSharing={isSharing}
      />

      {/* Screen Share Component */}
      {isSharing && (
        <ScreenShare
          onStreamReady={addStream}
          onStreamEnd={() => setIsSharing(false)}
        />
      )}

      {/* Video Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '20px'
      }}>
        {streams.map((streamObj) => (
          <div
            key={streamObj.id}
            onClick={() => setFullscreenStream(streamObj)}
            style={{
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <VideoPlayer
              stream={streamObj.stream}
              isFullscreen={false}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeStream(streamObj.id);
              }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}