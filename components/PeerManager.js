import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';
import { createPeerConnection } from '../lib/webrtc';

export default function PeerManager({ 
  userId, 
  roomId, 
  localStream, 
  onRemoteStream,
  onUserDisconnected 
}) {
  const socket = getSocket();
  const peers = useRef({});

  useEffect(() => {
    if (!socket || !userId || !roomId) return;

    // Join room
    socket.emit('join-room', roomId, userId);

    // Handle existing users
    socket.on('existing-users', (userIds) => {
      userIds.forEach((otherUserId) => {
        createPeerConnectionWith(otherUserId, false);
      });
    });

    // Handle new user
    socket.on('user-connected', (otherUserId) => {
      createPeerConnectionWith(otherUserId, true);
    });

    // Handle user disconnect
    socket.on('user-disconnected', (disconnectedUserId) => {
      if (peers.current[disconnectedUserId]) {
        peers.current[disconnectedUserId].close();
        delete peers.current[disconnectedUserId];
        onUserDisconnected(disconnectedUserId);
      }
    });

    // Handle WebRTC signaling
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      // Cleanup
      Object.values(peers.current).forEach(peer => peer.close());
      peers.current = {};
      socket.off('existing-users');
      socket.off('user-connected');
      socket.off('user-disconnected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, [socket, userId, roomId, localStream]);

  const createPeerConnectionWith = async (otherUserId, isInitiator) => {
    const peerConnection = createPeerConnection();
    
    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        onRemoteStream(otherUserId, event.streams[0]);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          target: otherUserId,
          candidate: event.candidate,
          sender: userId,
        });
      }
    };

    peers.current[otherUserId] = peerConnection;

    // Create offer if initiator
    if (isInitiator) {
      try {
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await peerConnection.setLocalDescription(offer);
        
        socket.emit('offer', {
          target: otherUserId,
          sdp: offer,
          sender: userId,
        });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }

    return peerConnection;
  };

  const handleOffer = async (data) => {
    const { sdp, sender } = data;
    
    if (!peers.current[sender]) {
      await createPeerConnectionWith(sender, false);
    }

    const peerConnection = peers.current[sender];
    
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.emit('answer', {
        target: sender,
        sdp: answer,
        sender: userId,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (data) => {
    const { sdp, sender } = data;
    
    const peerConnection = peers.current[sender];
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  const handleIceCandidate = async (data) => {
    const { candidate, sender } = data;
    
    const peerConnection = peers.current[sender];
    if (peerConnection && candidate) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  return null;
}
