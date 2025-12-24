import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { WebRTCManager } from '../lib/webrtc-simple';

const ScreenShare = dynamic(() => import('../components/ScreenShare'), { ssr: false });
const VideoPlayer = dynamic(() => import('../components/VideoPlayer'), { ssr: false });

export default function Room() {
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [fullscreenStream, setFullscreenStream] = useState(null);
  const [status, setStatus] = useState('Ready to share');
  const [participants, setParticipants] = useState([]);
  const router = useRouter();
  const webrtcManager = useRef(null);

  useEffect(() => {
    // Check authentication
    const hasAccess = localStorage.getItem('hasAccess');
    if (!hasAccess) {
      router.push('/');
      return;
    }

    // Initialize WebRTC manager
    webrtcManager.current = new WebRTCManager(userId, '251020031111222');
    
    // Set up remote stream handler
    webrtcManager.current.onRemoteStream = (userId, stream) => {
      console.log('Received remote stream from:', userId);
      setRemoteStreams(prev => {
        // Remove old stream from same user
        const filtered = prev.filter(s => s.userId !== userId);
        return [...filtered, { userId, stream }];
      });
      setParticipants(prev => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    };

    // Initialize socket
    webrtcManager.current.initSocket();

    return () => {
      if (webrtcManager.current) {
        webrtcManager.current.stop();
      }
    };
  }, []);

  const startSharing = () => {
    setIsSharing(true);
    setStatus('Starting screen share...');
  };

  const stopSharing = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsSharing(false);
    setStatus('Screen sharing stopped');
  };

  const handleStreamReady = (stream) => {
    console.log('Local stream ready');
    setLocalStream(stream);
    setStatus('Screen sharing active');
    
    // Set stream in WebRTC manager
    if (webrtcManager.current) {
      webrtcManager.current.setLocalStream(stream);
    }
  };

  const handleStreamEnd = () => {
    console.log('Local stream ended');
    setLocalStream(null);
    setIsSharing(false);
    setStatus('Screen sharing stopped');
    
    // Clear stream in WebRTC manager
    if (webrtcManager.current) {
      webrtcManager.current.setLocalStream(null);
    }
  };

  const leaveRoom = () => {
    if (webrtcManager.current) {
      webrtcManager.current.stop();
    }
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
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#4CAF50' }}>Screen Share Room</h1>
          <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '14px' }}>
            Room: 251020031111222 • Participants: {participants.length + 1}
          </p>
          <p style={{ margin: '5px 0 0 0', color: '#4CAF50', fontSize: '14px' }}>
            Status: {status}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigator.clipboard.writeText('251020031111222')}
            style={{
              padding: '10px 15px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Copy Room Code
          </button>
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
          <button
            onClick={() => setFullscreenStream(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '10px 20px',
              backgroundColor: 'rgba(255,0,0,0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              zIndex: 1001
            }}
          >
            Exit Fullscreen (ESC)
          </button>
        </div>
      )}

      {/* Control Panel */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '15px 25px',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        border: '1px solid #444',
        zIndex: 100,
        display: 'flex',
        gap: '15px'
      }}>
        {!isSharing ? (
          <button
            onClick={startSharing}
            style={{
              padding: '12px 30px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            📺 Start Sharing Screen
          </button>
        ) : (
          <button
            onClick={stopSharing}
            style={{
              padding: '12px 30px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            ⏹️ Stop Sharing
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

      {/* Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Local Stream */}
        {localStream && (
          <div>
            <h2>🎥 Your Screen (Shared with others)</h2>
            <div
              onClick={() => setFullscreenStream(localStream)}
              style={{
                cursor: 'pointer',
                maxWidth: '800px',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '3px solid #4CAF50',
                backgroundColor: '#000'
              }}
            >
              <VideoPlayer
                stream={localStream}
                isFullscreen={false}
              />
              <div style={{
                padding: '10px',
                backgroundColor: '#2a2a2a',
                textAlign: 'center',
                color: '#4CAF50',
                fontWeight: 'bold'
              }}>
                🔴 LIVE - You are sharing
              </div>
            </div>
          </div>
        )}

        {/* Remote Streams */}
        {remoteStreams.length > 0 && (
          <div>
            <h2>👥 Other Participants ({remoteStreams.length})</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '25px'
            }}>
              {remoteStreams.map((remote) => (
                <div
                  key={remote.userId}
                  onClick={() => setFullscreenStream(remote.stream)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: '#2a2a2a',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    transition: 'transform 0.2s',
                    border: '2px solid #2196F3'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <VideoPlayer
                    stream={remote.stream}
                    isFullscreen={false}
                  />
                  <div style={{
                    padding: '15px',
                    textAlign: 'center',
                    backgroundColor: '#333',
                    borderTop: '1px solid #444'
                  }}>
                    <div style={{ color: '#2196F3', fontWeight: 'bold' }}>
                      Participant {remote.userId.substring(0, 8)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                      Click to view fullscreen
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div style={{
          marginTop: '50px',
          padding: '25px',
          backgroundColor: '#2a2a2a',
          borderRadius: '10px',
          borderLeft: '4px solid #4CAF50'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '15px' }}>📋 How to Connect Multiple Devices</h3>
          <ol style={{ lineHeight: '1.8', paddingLeft: '20px', color: '#ccc' }}>
            <li><strong>Device 1:</strong> Start sharing your screen using the green button</li>
            <li><strong>Device 2:</strong> Open this app on another device/computer</li>
            <li><strong>Device 2:</strong> Enter the same room code: <code style={{ backgroundColor: '#444', padding: '2px 5px', borderRadius: '3px' }}>251020031111222</code></li>
            <li><strong>Device 2:</strong> Wait a few seconds - you should see Device 1's screen automatically</li>
            <li><strong>Both devices:</strong> Click on any video to view in fullscreen mode</li>
            <li><strong>To stop:</strong> Click the red "Stop Sharing" button or leave the room</li>
          </ol>
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#333', borderRadius: '5px' }}>
            <p style={{ margin: 0, color: '#4CAF50' }}>
              💡 <strong>Tip:</strong> Make sure both devices are on the same network for best performance.
              The screen sharing works in the background - you can minimize the browser tab.
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <div style={{
          padding: '15px',
          backgroundColor: participants.length > 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 193, 7, 0.1)',
          borderRadius: '10px',
          border: `1px solid ${participants.length > 0 ? '#4CAF50' : '#FFC107'}`,
          textAlign: 'center'
        }}>
          {participants.length > 0 ? (
            <div style={{ color: '#4CAF50' }}>
              ✅ Connected to {participants.length} other device{participants.length > 1 ? 's' : ''}
            </div>
          ) : (
            <div style={{ color: '#FFC107' }}>
              ⚡ Waiting for other devices to join... Share the room code with others
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '50px',
        paddingTop: '20px',
        borderTop: '1px solid #333',
        textAlign: 'center',
        color: '#666',
        fontSize: '12px'
      }}>
        <p>
          Screen Share App • Room Code: 251020031111222 • 
          Your ID: <code>{userId.substring(0, 8)}</code>
        </p>
      </div>
    </div>
  );
}
