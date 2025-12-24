export const createPeerConnection = () => {
  const config = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ],
  };

  return new RTCPeerConnection(config);
};

export const getLocalStream = async () => {
  try {
    // For screen sharing with audio
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: 30,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    });

    // Get microphone audio
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Combine screen and microphone audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const destination = audioContext.createMediaStreamDestination();
    
    // Add screen audio
    const screenAudio = audioContext.createMediaStreamSource(
      new MediaStream(displayStream.getAudioTracks())
    );
    screenAudio.connect(destination);
    
    // Add microphone audio
    const micAudio = audioContext.createMediaStreamSource(micStream);
    micAudio.connect(destination);
    
    // Get screen video track
    const videoTrack = displayStream.getVideoTracks()[0];
    
    // Create final stream with combined audio
    const combinedStream = new MediaStream([
      videoTrack,
      ...destination.stream.getAudioTracks()
    ]);

    return combinedStream;
  } catch (error) {
    console.error("Error getting media streams:", error);
    throw error;
  }
};
