import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

export default function Room() {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [messages, setMessages] = useState([]);
  const [fullscreenId, setFullscreenId] = useState(null);
  
  const peerConnections = useRef({});
  const socketRef = useRef(null);
  const userId = useRef(localStorage.getItem('userId') || `user_${Date.now()}`);

  useEffect(() => {
    // Check access
    if (!localStorage.getItem('hasAccess')) {
      router.push('/');
      return;
    }

    // Initialize Socket.io
    initSocket();

    return () => {
      // Cleanup
      if (socketRef.current) socketRef.current.disconnect();
      Object.values(peerConnections.current).forEach(pc => pc.close());
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initSocket = () => {
    // Use a free public signaling server for demo
    const socket = new WebSocket('wss://websocket-echo.onrender.com');
    
    socket.onopen = () => {
      console.log('Connected to signaling server');
      socket.send(JSON.stringify({
        type: 'join',
        userId: userId.current,
        room: '251020031111222'
      }));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received:', data);
        
        switch (data.type) {
          case 'user-joined':
            if (data.userId !== userId.current) {
              await handleUserJoined(data.userId);
            }
            break;
            
          case 'offer':
            await handleOffer(data);
            break;
            
          case 'answer':
            await handleAnswer(data);
            break;
            
          case 'ice-candidate':
            await handleIceCandidate(data);
            break;
            
          case 'user-left':
            handleUserLeft(data.userId);
            break;
        }
      } catch (error) {
        console.log('Message parse error:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('Socket error:', error);
    };

    socketRef.current = socket;
  };

  const sendSignal = (data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  };

  const createPeerConnection = async (targetUserId) => {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ]
    };

    const pc = new RTCPeerConnection(config);
    peerConnections.current[targetUserId] = pc;

    // Add local stream if available
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track from', targetUserId);
      const stream = event.streams[0];
      if (stream) {
        setRemoteStreams(prev => {
          const existing = prev.find(s => s.userId === targetUserId);
          if (existing) {
            return prev.map(s => s.userId === targetUserId ? { ...s, stream } : s);
          }
          return [...prev, { userId: targetUserId, stream }];
        });
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'ice-candidate',
          from: userId.current,
          to: targetUserId,
          candidate: event.candidate
        });
      }
    };

    return pc;
  };

  const handleUserJoined = async (newUserId) => {
    console.log('New user joined:', newUserId);
    
    // Create peer connection
    const pc = await createPeerConnection(newUserId);
    
    // Create offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      sendSignal({
        type: 'offer',
        from: userId.current,
        to: newUserId,
        sdp: offer
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (data) => {
    const pc = await createPeerConnection(data.from);
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      sendSignal({
        type: 'answer',
        from: userId.current,
        to: data.from,
        sdp: answer
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (data) => {
    const pc = peerConnections.current[data.from];
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  const handleIceCandidate = async (data) => {
    const pc = peerConnections.current[data.from];
    if (pc && data.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  const handleUserLeft = (userId) => {
    const pc = peerConnections.current[userId];
    if (pc) {
      pc.close();
      delete peerConnections.current[userId];
    }
    setRemoteStreams(prev => prev.filter(s => s.userId !== userId));
  };

  const startScreenShare = async () => {
    try {
      console.log('Requesting screen share...');
      
      // Get screen with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      console.log('Got screen stream:', stream);
      setLocalStream(stream);
      setIsSharing(true);

      // Add stream to existing peer connections
      Object.values(peerConnections.current).forEach(pc => {
        stream.getTracks().forEach(track => {
          const sender = pc.getSenders().find(s => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            pc.addTrack(track, stream);
          }
        });
      });

      // Notify others
      sendSignal({
        type: 'screen-sharing',
        from: userId.current,
        isSharing: true
      });

      // Handle when user stops sharing via browser
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

    } catch (error) {
      console.error('Screen share error:', error);
      alert('Failed to share screen. Please allow permissions.');
    }
  };

  const stopScreenShare = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsSharing(false);
    
    sendSignal({
      type: 'screen-sharing',
      from: userId.current,
      isSharing: false
    });
  };

  const leaveRoom = () => {
    // Cleanup
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    localStorage.removeItem('hasAccess');
    router.push('/');
  };

  const renderVideo = (stream, title, isLocal = false) => {
    if (!stream) return null;
    
    return (
      <div style={{
        position: 'relative',
        backgroundColor: '#000',
        borderRadius: '10px',
        overflow: 'hidden',
        border: isLocal ? '3px solid #00ff88' : '2px solid #333',
        height: '250px'
      }}>
        <video
          autoPlay
          playsInline
          muted={isLocal}
          ref={(video) => {
            if (video) video.srcObject = stream;
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: '#000'
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>{title}</span>
          <span style={{ color: '#00ff88' }}>
            {isLocal ? '🔴 LIVE' : '📺'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
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
          <h1 style={{ margin: 0, color: '#00ff88' }}>🎥 Screen Share Room</h1>
          <p style={{ margin: '5px 0', color: '#888' }}>
            Room Code: <strong>251020031111222</strong> • 
            Your ID: <code style={{ background: '#2a2a2a', padding: '2px 5px', borderRadius: '3px' }}>
              {userId.current.substring(0, 8)}
            </code>
          </p>
        </div>
        <button
          onClick={leaveRoom}
          style={{
            padding: '10px 20px',
            background: '#ff4444',
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

      {/* Main Content */}
      <div style={{ display: 'grid', gap: '30px' }}>
        
        {/* Your Screen Section */}
        <div style={{
          background: '#1a1a1a',
          padding: '20px',
          borderRadius: '10px'
        }}>
          <h2 style={{ color: '#00ff88', marginBottom: '15px' }}>
            {isSharing ? '🎬 Your Shared Screen' : 'Your Screen'}
          </h2>
          
          {localStream ? (
            renderVideo(localStream, 'You (Host)', true)
          ) : (
            <div style={{
              background: '#2a2a2a',
              height: '250px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              color: '#888',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📺</div>
                <p>Screen not sharing</p>
              </div>
            </div>
          )}
          
          {/* Share Controls */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            {!isSharing ? (
              <button
                onClick={startScreenShare}
                style={{
                  padding: '12px 24px',
                  background: '#00ff88',
                  color: '#000',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                📺 Start Sharing Screen
              </button>
            ) : (
              <button
                onClick={stopScreenShare}
                style={{
                  padding: '12px 24px',
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                ⏹ Stop Sharing
              </button>
            )}
          </div>
        </div>

        {/* Others' Screens */}
        <div style={{
          background: '#1a1a1a',
          padding: '20px',
          borderRadius: '10px'
        }}>
          <h2 style={{ color: '#00ff88', marginBottom: '15px' }}>
            👥 Other Participants ({remoteStreams.length})
          </h2>
          
          {remoteStreams.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {remoteStreams.map((remote, index) => (
                <div key={remote.userId}>
                  {renderVideo(remote.stream, `Participant ${index + 1}`)}
                  <div style={{
                    marginTop: '10px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#888'
                  }}>
                    ID: {remote.userId.substring(0, 8)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: '#2a2a2a',
              padding: '40px',
              borderRadius: '10px',
              textAlign: 'center',
              color: '#888'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>👤</div>
              <h3>Waiting for others to join...</h3>
              <p style={{ marginTop: '10px' }}>
                Share this room code with others: <strong>251020031111222</strong>
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          background: 'rgba(0, 255, 136, 0.1)',
          borderLeft: '4px solid #00ff88',
          padding: '20px',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          <h3 style={{ color: '#00ff88', marginTop: 0 }}>📋 How to Connect Multiple Devices:</h3>
          <ol style={{ lineHeight: '2', paddingLeft: '20px' }}>
            <li><strong>Device 1:</strong> Click "Start Sharing Screen" - select screen/window to share</li>
            <li><strong>Device 2:</strong> Open this app in another browser/device</li>
            <li><strong>Device 2:</strong> Enter code: <code style={{ background: '#2a2a2a', padding: '2px 5px' }}>251020031111222</code></li>
            <li><strong>Device 2:</strong> Wait a few seconds - should see Device 1's screen automatically</li>
            <li>Works on Chrome, Edge, Firefox on desktop</li>
          </ol>
          <p style={{ marginTop: '15px', color: '#00ff88' }}>
            💡 <strong>Note:</strong> Both devices must be on the same WiFi network for best results
          </p>
        </div>

        {/* Debug Info */}
        <div style={{
          background: '#2a2a2a',
          padding: '15px',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#888'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Status: {socketRef.current?.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}</span>
            <span>Peer Connections: {Object.keys(peerConnections.current).length}</span>
            <span>Streams: {remoteStreams.length + (localStream ? 1 : 0)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #333',
        textAlign: 'center',
        color: '#666',
        fontSize: '12px'
      }}>
        <p>Screen Share App • Simple P2P Sharing • No login required</p>
      </div>
    </div>
  );
}
