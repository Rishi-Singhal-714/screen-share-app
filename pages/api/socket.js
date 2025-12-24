import { Server } from "socket.io";

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log("Socket is already running");
  } else {
    console.log("Socket is initializing");
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    const rooms = {};

    io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = userId;

        // Add user to room
        if (!rooms[roomId]) {
          rooms[roomId] = new Set();
        }
        rooms[roomId].add(userId);

        // Notify existing users
        socket.to(roomId).emit("user-connected", userId);

        // Send existing users to new user
        const users = Array.from(rooms[roomId] || [])
          .filter(id => id !== userId);
        socket.emit("existing-users", users);

        console.log(`User ${userId} joined room ${roomId}`);
      });

      socket.on("offer", (data) => {
        socket.to(data.target).emit("offer", {
          sdp: data.sdp,
          sender: data.sender,
        });
      });

      socket.on("answer", (data) => {
        socket.to(data.target).emit("answer", {
          sdp: data.sdp,
          sender: data.sender,
        });
      });

      socket.on("ice-candidate", (data) => {
        socket.to(data.target).emit("ice-candidate", {
          candidate: data.candidate,
          sender: data.sender,
        });
      });

      socket.on("disconnect", () => {
        const roomId = socket.roomId;
        const userId = socket.userId;
        
        if (roomId && userId && rooms[roomId]) {
          rooms[roomId].delete(userId);
          if (rooms[roomId].size === 0) {
            delete rooms[roomId];
          }
          
          socket.to(roomId).emit("user-disconnected", userId);
          console.log(`User ${userId} disconnected from room ${roomId}`);
        }
      });
    });
  }
  res.end();
};

export default SocketHandler;
