import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamically import components
const ScreenShare = dynamic(() => import('../components/ScreenShare'), { ssr: false });
const VideoPlayer = dynamic(() => import('../components/VideoPlayer'), { ssr: false });
const ControlPanel = dynamic(() => import('../components/ControlPanel'), { ssr: false });

export default function Room() {
  const [streams, setStreams] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [fullscreenStream, setFullscreenStream] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication on component mount
  useEffect(() => {
    const hasAccess = localStorage.getItem('hasAccess');
    if (!hasAccess) {
      router.push('/');
    } else {
      setIsLoading(false);
    }
  }, []);

  const addStream = (stream) => {
    const streamId = Date.now();
    setStreams(prev => [...prev, { id: streamId, stream }]);
    
    // Auto-play the video
    setTimeout(() => {
      const video = document.getElementById(`video-${streamId}`);
      if (video && video.paused) {
        video.play().catch(e => console.log('Auto-play prevented:', e));
      }
    }, 100);
  };

  const removeStream = (id) => {
    setStreams(prev => {
      const streamToRemove = prev.find(s => s.id === id);
      if (streamToRemove) {
        streamToRemove.stream.getTracks().forEach(track => track.stop());
      }
      return prev.filter(s => s.id !== id);
    });
    if (fullscreenStream?.id === id) {
      setFullscreenStream(null);
    }
  };

  const leaveRoom = () => {
    // Stop all streams
    streams.forEach(streamObj => {
      streamObj.stream.getTracks().forEach(track => track.stop());
    });
    // Clear local storage and redirect
    localStorage.removeItem('hasAccess');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        color: 'white'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '1px solid #333'
      }}>
        <h1 style={{ 
          color: '#4CAF50', 
          margin: 0,
          fontSize: '24px'
        }}>
          Screen Share Room
        </h1>
        <button
          onClick={leaveRoom}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Leave Room
        </button>
      </div>

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
        onShareStop={() => {
          setIsSharing(false);
          // When stopping share, remove the last added stream
          if (streams.length > 0) {
            removeStream(streams[streams.length - 1].id);
          }
        }}
        isSharing={isSharing}
      />

      {/* Screen Share Component */}
      {isSharing && (
        <ScreenShare
          onStreamReady={addStream}
          onStreamEnd={() => setIsSharing(false)}
        />
      )}

      {/* Status Message */}
      {streams.length === 0 && !isSharing && (
        <div style={{
          textAlign: 'center',
          color: '#888',
          marginTop: '50px'
        }}>
          <p>No screens being shared</p>
          <p>Click "Start Sharing Screen" to begin</p>
        </div>
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
              position: 'relative',
              borderRadius: '10px',
              overflow: 'hidden',
              backgroundColor: '#2a2a2a',
              transition: 'transform 0.2s',
              border: fullscreenStream?.id === streamObj.id ? '3px solid #4CAF50' : '1px solid #333'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            <VideoPlayer
              stream={streamObj.stream}
              isFullscreen={false}
              streamId={streamObj.id}
            />
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              display: 'flex',
              gap: '5px'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenStream(streamObj);
                }}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ⛶
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeStream(streamObj.id);
                }}
                style={{
                  backgroundColor: 'rgba(255,0,0,0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '12px'
            }}>
              {streamObj.id === streams[0]?.id ? 'Host' : 'Participant'}
            </div>
          </div>
        ))}
      </div>

      {/* Info Footer */}
      <div style={{
        marginTop: '30px',
        color: '#666',
        fontSize: '12px',
        textAlign: 'center'
      }}>
        <p>Click on any screen to view in fullscreen mode</p>
        <p>Click the fullscreen button (⛶) to focus on that screen</p>
      </div>
    </div>
  );
}
