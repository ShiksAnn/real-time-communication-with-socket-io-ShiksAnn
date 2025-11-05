// socket handling: global namespace
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

module.exports = (io) => {
  // We'll use a single default namespace for simplicity; could split namespaces like /chat
  const chat = io.of('/chat');

  // map socketId -> userId (keeps online list)
  const onlineUsers = new Map();

  chat.on('connection', async (socket) => {
    console.log('Socket connected', socket.id);

    // Authenticate socket (client sends token)
    const token = socket.handshake.auth?.token;
    let user = null;
    try {
      if (token) {
        const data = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        user = await User.findById(data.id);
        if (user) {
          user.online = true;
          user.socketId = socket.id;
          await user.save();
          onlineUsers.set(user._id.toString(), socket.id);
        }
      }
    } catch (err) {
      console.log('Socket auth failed', err.message);
    }

    // Broadcast updated online users
    const currentlyOnline = await User.find({ online: true }).select('username');
    chat.emit('online-users', currentlyOnline.map(u => ({ id: u._id, username: u.username })));

    // handle joining a room
    socket.on('join-room', async ({ room }) => {
      socket.join(room);
      // send recent messages (pagination: last 20)
      const recent = await Message.find({ room }).sort({ createdAt: -1 }).limit(20).populate('sender', 'username');
      socket.emit('room-history', recent.reverse().map(m => ({
        id: m._id,
        sender: { id: m.sender._id, username: m.sender.username },
        content: m.content,
        type: m.type,
        meta: m.meta,
        createdAt: m.createdAt,
        readBy: m.readBy
      })));
      chat.to(room).emit('user-joined', { username: user?.username, room });
    });

    // typing indicator per room
    socket.on('typing', ({ room, isTyping }) => {
      socket.to(room).emit('typing', { username: user?.username, isTyping });
    });

    // send message
    socket.on('send-message', async ({ room, content, type = 'text', meta = {} }, ack) => {
      try {
        if (!user) return ack?.({ status: 'error', message: 'Not authenticated' });
        const message = await Message.create({ sender: user._id, room, content, type, meta });
        await message.populate('sender', 'username');
        const payload = {
          id: message._id,
          sender: { id: user._id, username: user.username },
          content: message.content,
          type: message.type,
          meta: message.meta,
          createdAt: message.createdAt
        };
        // emit to room
        chat.to(room).emit('new-message', payload);
        // ack back to sender with delivery timestamp
        ack?.({ status: 'ok', deliveredAt: new Date() });
      } catch (err) {
        console.error(err);
        ack?.({ status: 'error' });
      }
    });

    // private message: emit to single socket
    socket.on('private-message', async ({ toUserId, content }, ack) => {
      try {
        if (!user) return ack?.({ status: 'error' });
        const toSocket = onlineUsers.get(toUserId);
        const message = await Message.create({ sender: user._id, room: `private:${[user._id, toUserId].sort().join(':')}`, content });
        await message.populate('sender', 'username');
        const payload = {
          id: message._id,
          sender: { id: user._id, username: user.username },
          content: message.content,
          createdAt: message.createdAt
        };
        if (toSocket) chat.to(toSocket).emit('private-message', payload);
        // also send to sender so UI can append
        socket.emit('private-message', payload);
        ack?.({ status: 'ok' });
      } catch (err) {
        console.error(err);
        ack?.({ status: 'error' });
      }
    });

    // message read receipts
    socket.on('mark-read', async ({ messageId }) => {
      try {
        if (!user) return;
        const msg = await Message.findById(messageId);
        if (!msg) return;
        if (!msg.readBy.includes(user._id)) {
          msg.readBy.push(user._id);
          await msg.save();
        }
        // notify sender
        const sender = await User.findById(msg.sender);
        if (sender?.socketId) chat.to(sender.socketId).emit('message-read', { messageId, userId: user._id });
      } catch (err) {
        console.error(err);
      }
    });

    // pagination: load older messages
    socket.on('load-more', async ({ room, before }, ack) => {
      try {
        const query = { room };
        if (before) query.createdAt = { $lt: new Date(before) };
        const older = await Message.find(query).sort({ createdAt: -1 }).limit(20).populate('sender', 'username');
        ack?.({ status: 'ok', messages: older.reverse().map(m => ({
          id: m._id,
          sender: { id: m.sender._id, username: m.sender.username },
          content: m.content,
          createdAt: m.createdAt
        }))});
      } catch (err) {
        console.error(err);
        ack?.({ status: 'error' });
      }
    });

    socket.on('disconnect', async (reason) => {
      console.log('Socket disconnected', socket.id, reason);
      if (user) {
        user.online = false;
        user.socketId = null;
        await user.save();
        onlineUsers.delete(user._id.toString());
        const currentlyOnline = await User.find({ online: true }).select('username');
        chat.emit('online-users', currentlyOnline.map(u => ({ id: u._id, username: u.username })));
        chat.emit('user-left', { username: user.username });
      }
    });
  });
};
