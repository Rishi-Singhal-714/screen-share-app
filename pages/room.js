import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const ScreenShare = dynamic(() => import('../components/ScreenShare'), { ssr: false });
const VideoPlayer = dynamic(() => import('../components/VideoPlayer'), { ssr: false });

export default function Room() {
  const [isSharing, setIsSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [fullscreenStream, setFullscreenStream] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const hasAccess = localStorage.getItem('hasAccess');
    if (!hasAccess) {
      router.push('/');
    }
  }, []);

  const handleStreamReady = (stream) => {
    setLocalStream(stream);
    // In a real app, you'd send this stream to other users via WebRTC
    console.log('Stream ready for sharing:', stream);
  };

  const handleStreamEnd = () => {
    setLocalStream(null);
    setIsSharing(false);
    console.log('Stream sharing ended');
  };

  const startSharing = () => {
    setIsSharing(true);
  };

  const stopSharing = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setIsSharing(false);
  };

  const leaveRoom = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    localStorage.removeItem('hasAccess');
    router.push('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1>Screen Share Room</h1>
        <button
          onClick={leaveRoom}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
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
            stream={fullscreenStream}
            isFullscreen={true}
            onExit={() => setFullscreenStream(null)}
          />
        </div>
      )}

      {/* Control Panel */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '10px',
        backdropFilter: 'blur(10px)',
        zIndex: 100
      }}>
        {!isSharing ? (
          <button
            onClick={startSharing}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Start Sharing Screen
          </button>
        ) : (
          <button
            onClick={stopSharing}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Stop Sharing
          </button>
        )}
      </div>

      {/* Screen Share Component */}
      {isSharing && (
        <ScreenShare
          onStreamReady={handleStreamReady}
          onStreamEnd={handleStreamEnd}
          audioEnabled={true}
        />
      )}

      {/* Local Stream Preview */}
      {localStream && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Your Screen (Being Shared)</h3>
          <div
            onClick={() => setFullscreenStream(localStream)}
            style={{ cursor: 'pointer', maxWidth: '800px' }}
          >
            <VideoPlayer
              stream={localStream}
              isFullscreen={false}
            />
          </div>
        </div>
      )}

      {/* Remote Streams (Placeholder - in real app these would come from WebRTC) */}
      {remoteStreams.length > 0 && (
        <div>
          <h3>Participants ({remoteStreams.length})</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {remoteStreams.map((stream, index) => (
              <div
                key={index}
                onClick={() => setFullscreenStream(stream)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}
              >
                <VideoPlayer
                  stream={stream}
                  isFullscreen={false}
                />
                <div style={{
                  padding: '10px',
                  textAlign: 'center'
                }}>
                  Participant {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '50px',
        padding: '20px',
        backgroundColor: '#2a2a2a',
        borderRadius: '10px'
      }}>
        <h4>How to use:</h4>
        <ul>
          <li>Click "Start Sharing Screen" to share your screen</li>
          <li>Select the screen/window you want to share in the browser prompt</li>
          <li>Audio from your screen and microphone will be shared</li>
          <li>Click on any video to view in fullscreen</li>
          <li>Click "Stop Sharing" or close the browser tab to stop</li>
        </ul>
      </div>
    </div>
  );
}
