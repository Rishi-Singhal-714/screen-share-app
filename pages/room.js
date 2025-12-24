import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { initSocket } from '../lib/socket';
import { getLocalStream } from '../lib/webrtc';

// Dynamically import components
const PeerManager = dynamic(() => import('../components/PeerManager'), { ssr: false });
const VideoPlayer = dynamic(() => import('../components/VideoPlayer'), { ssr: false });
const ControlPanel = dynamic(() => import('../components/ControlPanel'), { ssr: false });

export default function Room() {
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [streams, setStreams] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [fullscreenStream, setFullscreenStream] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const roomId = '251020031111222';

  // Initialize socket
  useEffect(() => {
    initSocket();
    const hasAccess = localStorage.getItem('hasAccess');
    if (!hasAccess) {
      router.push('/');
    } else {
      setIsLoading(false);
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScreenSharing = async () => {
    try {
      const stream = await getLocalStream();
      setLocalStream(stream);
      setIsSharing(true);
      
      // Add local stream to streams
      setStreams(prev => [...prev, { 
        id: userId, 
        stream, 
        isLocal: true,
        name: 'You (Host)' 
      }]);

      // Handle when user stops sharing via browser
      stream.getVideoTracks()[0].onended = () => {
        stopScreenSharing();
      };
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      alert('Failed to share screen. Please check permissions.');
    }
  };

  const stopScreenSharing = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsSharing(false);
    
    // Remove local stream
    setStreams(prev => prev.filter(s => s.id !== userId));
  };

  const handleRemoteStream = (remoteUserId, remoteStream) => {
    setStreams(prev => {
      // Remove existing stream from same user
      const filtered = prev.filter(s => s.id !== remoteUserId);
      return [...filtered, { 
        id: remoteUserId, 
        stream: remoteStream, 
        isLocal: false,
        name: `Participant ${remoteUserId.substring(0, 8)}` 
      }];
    });
  };

  const handleUserDisconnected = (disconnectedUserId) => {
    setStreams(prev => prev.filter(s => s.id !== disconnectedUserId));
  };

  const removeStream = (streamId) => {
    if (streamId === userId) {
      stopScreenSharing();
    } else {
      setStreams(prev => prev.filter(s => s.id !== streamId));
    }
  };

  const leaveRoom = () => {
    // Stop all streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
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
      {/* WebRTC Peer Manager */}
      <PeerManager
        userId={userId}
        roomId={roomId}
        localStream={localStream}
        onRemoteStream={handleRemoteStream}
        onUserDisconnected={handleUserDisconnected}
      />

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '1px solid #333'
      }}>
        <div>
          <h1 style={{ 
            color: '#4CAF50', 
            margin: 0,
            fontSize: '24px'
          }}>
            Screen Share Room
          </h1>
          <p style={{ color: '#888', marginTop: '5px', fontSize: '14px' }}>
            Room ID: {roomId} • Participants: {streams.length}
          </p>
        </div>
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
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '10px',
            borderRadius: '5px'
          }}>
            {fullscreenStream.name}
          </div>
        </div>
      )}

      {/* Control Panel */}
      <ControlPanel
        onShareStart={startScreenSharing}
        onShareStop={stopScreenSharing}
        isSharing={isSharing}
      />

      {/* Status Messages */}
      {streams.length === 0 && (
        <div style={{
          textAlign: 'center',
          color: '#888',
          marginTop: '50px',
          padding: '40px',
          backgroundColor: '#2a2a2a',
          borderRadius: '10px',
          maxWidth: '600px',
          margin: '50px auto'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '20px' }}>No screens being shared</h3>
          <p>Click "Start Sharing Screen" to begin broadcasting your screen to others</p>
          <p style={{ fontSize: '12px', marginTop: '20px', color: '#666' }}>
            Other users can join using the same room code: <strong>{roomId}</strong>
          </p>
        </div>
      )}

      {/* Video Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
              transition: 'all 0.3s',
              border: streamObj.isLocal ? '3px solid #4CAF50' : '1px solid #333',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <VideoPlayer
              stream={streamObj.stream}
              isFullscreen={false}
            />
            
            {/* Overlay Controls */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)'
            }}>
              <span style={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                backgroundColor: streamObj.isLocal ? '#4CAF50' : '#2196F3',
                padding: '3px 10px',
                borderRadius: '20px'
              }}>
                {streamObj.name}
              </span>
              <div style={{ display: 'flex', gap: '5px' }}>
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
                    fontSize: '16px'
                  }}
                >
                  ⛶
                </button>
                {streamObj.isLocal && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stopScreenSharing();
                    }}
                    style={{
                      backgroundColor: 'rgba(255,0,0,0.7)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      width: '30px',
                      height: '30px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    ⏹
                  </button>
                )}
              </div>
            </div>

            {/* Connection Status */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: '#4CAF50',
              fontSize: '12px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                animation: 'pulse 2s infinite'
              }}></div>
              Live
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#2a2a2a',
        borderRadius: '10px',
        color: '#aaa',
        fontSize: '14px'
      }}>
        <h4 style={{ color: '#fff', marginBottom: '10px' }}>How to use:</h4>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>Share your screen using the control panel at the bottom</li>
          <li>Others can join using the same room code on their devices</li>
          <li>Click on any video to view in fullscreen</li>
          <li>Use ESC key to exit fullscreen mode</li>
          <li>All connections are peer-to-peer (no server recording)</li>
        </ul>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
