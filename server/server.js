// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app and server
const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage (temporary)
const users = {}; // { socketId: { username, id } }
const messages = []; // global chat messages
const typingUsers = {}; // { socketId: username }

// --- SOCKET.IO EVENTS ---
io.on('connection', (socket) => {
  console.log(`🟢 User connected: ${socket.id}`);

  // User joins chat
  socket.on('user_join', (username) => {
    users[socket.id] = { username, id: socket.id };
    console.log(`👤 ${username} joined`);

    // Notify all clients
    io.emit('user_list', Object.values(users));
    io.emit('user_joined', { username, id: socket.id });
  });

  // Handle chat message
  socket.on('send_message', (messageData) => {
    const sender = users[socket.id]?.username || 'Anonymous';
    const message = {
      ...messageData,
      id: Date.now(),
      sender,
      senderId: socket.id,
      timestamp: new Date().toISOString(),
    };

    // Store and trim messages
    messages.push(message);
    if (messages.length > 200) messages.shift();

    io.emit('receive_message', message);
  });

  // Typing indicator
  socket.on('typing', (isTyping) => {
    const username = users[socket.id]?.username;
    if (!username) return;

    if (isTyping) typingUsers[socket.id] = username;
    else delete typingUsers[socket.id];

    io.emit('typing_users', Object.values(typingUsers));
  });

  // Private messaging
  socket.on('private_message', ({ to, message }) => {
    const sender = users[socket.id]?.username || 'Anonymous';
    const messageData = {
      id: Date.now(),
      sender,
      senderId: socket.id,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
    };

    // Send to recipient and echo to sender
    socket.to(to).emit('private_message', messageData);
    socket.emit('private_message', messageData);
  });

  // User disconnect
  socket.on('disconnect', () => {
    const username = users[socket.id]?.username;
    if (username) {
      console.log(`🔴 ${username} disconnected`);
      io.emit('user_left', { username, id: socket.id });
    }

    delete users[socket.id];
    delete typingUsers[socket.id];

    io.emit('user_list', Object.values(users));
    io.emit('typing_users', Object.values(typingUsers));
  });
});

// --- EXPRESS ROUTES ---
// Get all messages
app.get('/api/messages', (req, res) => {
  res.status(200).json(messages);
});

// Get all online users
app.get('/api/users', (req, res) => {
  res.status(200).json(Object.values(users));
});

// Root route
app.get('/', (req, res) => {
  res.send('✅ Socket.io Chat Server is running');
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, server, io };
