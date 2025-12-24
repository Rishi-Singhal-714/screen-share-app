// Simple WebRTC implementation for screen sharing between devices

export class WebRTCManager {
  constructor(userId, roomId) {
    this.userId = userId;
    this.roomId = roomId;
    this.peers = {};
    this.localStream = null;
    this.socket = null;
    this.onRemoteStream = null;
  }

  // Initialize socket connection
  initSocket() {
    if (typeof window === 'undefined') return;
    
    // Simple WebSocket connection
    this.socket = new WebSocket('wss://ws.postman-echo.com/raw');
    
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.joinRoom();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.log('Received non-JSON message:', event.data);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  joinRoom() {
    const message = {
      type: 'join',
      userId: this.userId,
      roomId: this.roomId
    };
    this.socket.send(JSON.stringify(message));
  }

  sendMessage(to, type, data) {
    const message = {
      type,
      from: this.userId,
      to,
      roomId: this.roomId,
      data
    };
    this.socket.send(JSON.stringify(message));
  }

  handleMessage(message) {
    switch (message.type) {
      case 'offer':
        this.handleOffer(message.from, message.data);
        break;
      case 'answer':
        this.handleAnswer(message.from, message.data);
        break;
      case 'ice-candidate':
        this.handleIceCandidate(message.from, message.data);
        break;
      case 'user-joined':
        this.handleUserJoined(message.from);
        break;
      case 'user-left':
        this.handleUserLeft(message.from);
        break;
    }
  }

  async createPeerConnection(targetUserId, isInitiator = false) {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ]
    };

    const peer = new RTCPeerConnection(config);

    // Add local stream if available
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peer.addTrack(track, this.localStream);
      });
    }

    // Handle incoming stream
    peer.ontrack = (event) => {
      if (this.onRemoteStream && event.streams[0]) {
        this.onRemoteStream(targetUserId, event.streams[0]);
      }
    };

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendMessage(targetUserId, 'ice-candidate', event.candidate);
      }
    };

    this.peers[targetUserId] = peer;

    // Create offer if initiator
    if (isInitiator) {
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        this.sendMessage(targetUserId, 'offer', offer);
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }

    return peer;
  }

  async handleOffer(from, offer) {
    const peer = await this.createPeerConnection(from, false);
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    
    this.sendMessage(from, 'answer', answer);
  }

  async handleAnswer(from, answer) {
    const peer = this.peers[from];
    if (peer) {
      await peer.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async handleIceCandidate(from, candidate) {
    const peer = this.peers[from];
    if (peer && candidate) {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  handleUserJoined(userId) {
    // Create peer connection with new user
    this.createPeerConnection(userId, true);
  }

  handleUserLeft(userId) {
    if (this.peers[userId]) {
      this.peers[userId].close();
      delete this.peers[userId];
    }
  }

  setLocalStream(stream) {
    this.localStream = stream;
    // Add stream to existing peers
    Object.values(this.peers).forEach(peer => {
      if (stream) {
        stream.getTracks().forEach(track => {
          peer.addTrack(track, stream);
        });
      }
    });
  }

  stop() {
    // Close all peer connections
    Object.values(this.peers).forEach(peer => peer.close());
    this.peers = {};
    
    // Close socket
    if (this.socket) {
      this.socket.close();
    }
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }
}
