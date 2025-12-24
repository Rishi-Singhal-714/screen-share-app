// Simple signaling server using HTTP polling
let rooms = {};

export default function handler(req, res) {
  const { roomId, userId, action, data, target } = req.query;

  if (!rooms[roomId]) {
    rooms[roomId] = {
      users: {},
      messages: []
    };
  }

  const room = rooms[roomId];

  switch (action) {
    case 'join':
      room.users[userId] = Date.now();
      res.status(200).json({ success: true });
      break;

    case 'offer':
    case 'answer':
    case 'ice-candidate':
      // Store message for target user
      const message = {
        type: action,
        from: userId,
        to: target,
        data: JSON.parse(data),
        timestamp: Date.now()
      };
      room.messages.push(message);
      res.status(200).json({ success: true });
      break;

    case 'poll':
      // Get messages for this user
      const userMessages = room.messages.filter(m => m.to === userId);
      // Remove delivered messages
      room.messages = room.messages.filter(m => m.to !== userId);
      res.status(200).json({ messages: userMessages });
      break;

    case 'users':
      res.status(200).json({ users: Object.keys(room.users) });
      break;

    case 'leave':
      delete room.users[userId];
      res.status(200).json({ success: true });
      break;

    default:
      res.status(400).json({ error: 'Invalid action' });
  }
}
