Project overview

This repository delivers a two-folder project:

server/ — Express server enhanced with Socket.io for real-time events, simple JWT auth (endpoints), MongoDB models (optional), message persistence, rooms, private messaging, typing indicators, read receipts, message pagination, and socket ack/delivery.

client/ — Vite + React app using socket.io-client, axios, react-router-dom, and TailwindCSS for UI. It includes a socket module and a useSocket pattern to interact with the server, UI components for chat, sidebar, typing indicator, notifications (sound + browser), pagination, and responsive layout.

The code intentionally keeps server and client separate so you can run and deploy them independently.

Features implemented

Task 1 (Project setup)

Express server with Socket.io namespace /chat.

React Vite client configured with socket.io-client.

Socket authentication using JWT from handshake.auth.token (server accepts token, optional username fallback).

Logs connected users to the console and emits online-users.

Task 2 (Core chat)

Username-based auth (register/login returning JWT).

Global chat room (global) for all users.

Messages show sender, timestamp; UI auto-scrolls to newest.

Typing indicators per room (typing event).

Real-time online/offline status.

Task 3 (Advanced — at least 3 implemented)

✅ Private one-to-one messaging (private-message with deterministic room id private:userA:userB).

✅ Multiple chat rooms/channels (join-room, room-history).

✅ Read receipts (mark-read event updates Message.readBy, notifies sender).

Pagination (load older messages via load-more).

Delivery acknowledgements for send-message (via socket ack callback).

Task 4 (Notifications)

Real-time notifications for new messages and user joins/leaves.

Sound notification support (client loads notification.mp3).

Browser notifications supported (UI can call Notification.requestPermission() — see suggestions).

Task 5 (Performance & UX)

Message pagination (cursor with createdAt).

Reconnection logic (socket.io client auto-reconnect).

Namespaces & rooms used for organization (/chat namespace and per-room joins).

Message delivery ack implemented.

Mobile responsive layout via Tailwind (basic; can be extended).

Notes: File/image uploading support is scaffolded (message meta supports file URLs). Cloudinary integration is optional and left as an easy next step. Message reactions & search are scaffolded but left as optional extensions.

```
Project structure
week5-socketio-chat/
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── server.js                # or src/index.js - main server entry
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── roomController.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Message.js
│   │   │   └── Room.js
│   │   └── sockets/index.js     # socket handler for /chat
│   └── uploads/                 # optional local uploads (gitignored)
└── client/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env
    ├── public/
    │   └── notification.mp3
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   ├── api/api.js
    │   ├── socket/socket.js     # exports `socket` instance and `useSocket` hook
    │   ├── hooks/useSocket.js  # alternate hook style (if present)
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   └── Chat.jsx
    │   └── components/
    │       ├── Sidebar.jsx
    │       ├── ChatWindow.jsx
    │       ├── Message.jsx
    │       └── TypingIndicator.jsx


Setup & run (local)

These instructions assume you have Node.js (v18+ recommended), npm, and optionally MongoDB running (if you use the DB parts). Work from the project root.

1) Install dependencies

Server

cd server
npm install


Client

cd ../client
npm install


If you get Vite errors like Failed to run dependency scan or missing modules, ensure you installed packages inside client/ (React, axios, react-router-dom, socket.io-client, tailwindcss, postcss, autoprefixer).

2) Environment variables

server/.env

PORT=5000
MONGO_URI=mongodb://localhost:27017/week5chat   # optional
JWT_SECRET=supersecretkey
CLIENT_URL=http://localhost:5173
CLOUDINARY_URL=...   # optional if you integrate Cloudinary


client/.env

VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000


Make sure .env files are in the correct folders, and restart servers on change.

3) Start servers (dev)

Server (with nodemon)

cd server
npm run dev
# or for production:
npm start


Client (Vite)

cd client
npm run dev
# open http://localhost:5173

4) Register / Login (first run)

Open the client in the browser: http://localhost:5173

Register a new user or login with username/password — frontend stores JWT in localStorage.

The client connects to the /chat namespace and automatically authenticates via handshake.auth.token (sent in socket options).

Environment & scripts quick reference

server/package.json (scripts)

"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}


client/package.json (scripts)

"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}

API routes & Socket events (reference)
HTTP endpoints

POST /api/auth/register — { username, password } → { token, user }

POST /api/auth/login — { username, password } → { token, user }

GET /api/auth/me — (Authorization: Bearer <token>) → { user }

GET /api/rooms — list public rooms (optional)

GET /api/messages — returns in-memory message history (or DB)

Socket namespace

Namespace: /chat (server uses const chat = io.of('/chat'))

Socket events (client → server)

join-room { room } — join a room (server emits room-history)

typing { room, isTyping } — typing indicator in a room

send-message { room, content, type, meta } — saves and emits message; supports ack callback ack({status:'ok', deliveredAt:...})

private-message { toUserId, content, type, meta } — one-to-one DM

mark-read { messageId } — mark message read (server notifies original sender)

load-more { room, before } — pagination: server responds via ack with historical messages

Socket events (server → client)

online-users [ { id, username } ] — current online users

room-history [ messages ] — initial room messages on join

new-message message — broadcast to room

private-message message — DM

typing { username, isTyping } — typing indicator per room

user-joined { username, room }

user-left { username }

message-read { messageId, userId } — delivery/read info

How major features work — implementation notes
Authentication

Simple username/password with bcrypt hashing on the server and JSON Web Tokens (JWT) for stateless auth. Frontend stores JWT in localStorage and sends it on API requests and Socket handshake (via auth).

Rooms & private chats

Global room: uses a fixed room id global.

Private DM: server uses deterministic room id private:${sortedPair} (so either user joining the same pair ends up in the same room).

Rooms use Socket.io socket.join(room) and chat.to(room).emit(...).

Message persistence & pagination

Messages persisted in MongoDB (when DB option used) or in-memory array in the simple server version. Pagination uses createdAt cursor and limit with load-more.

Typing indicators

Client emits typing events to the room; server forwards to other members.

Read receipts & delivery ack

send-message uses socket ack to inform the sender when the server persisted and emitted the message.

mark-read updates Message.readBy and server notifies the sender with message-read.

Notifications & sound

Client plays notification.mp3 on new message events.

Browser notifications are supported by calling Notification.requestPermission() and then new Notification(...) on new messages (permission required).

Performance, UX & production notes

Use Redis adapter for Socket.io if you scale to multiple Node instances (so namespaces/rooms are synchronized).

Use Cloudinary (or S3) for file uploads and serve file URLs in message.meta.

Limit message retention or implement paged DB queries for long histories (avoid in-memory huge arrays).

Add rate limiting and input validation (to prevent spam and injection).

Use HTTPS + secure cookies for production; set CORS appropriately to allowed domains only.

Bundle & serve client from a CDN or static server for production, and consider deploying server behind a process manager (PM2) or container.

Troubleshooting & common errors
Failed to resolve import "socket.io-client"

Make sure socket.io-client is installed inside the client/ folder:

cd client
npm install socket.io-client

Vite shows Failed to run dependency scan for axios or react-router-dom

Install those in client/:

cd client
npm install axios react-router-dom

ERR_CONNECTION_REFUSED or vite.svg errors

Means the dev server (Vite or backend) is not running or crashed.

Start backend: cd server && npm run dev

Start frontend: cd client && npm run dev

Hard refresh the browser (Ctrl+Shift+R)

If HMR websocket fails, configure server.host in vite.config.js or use npm run dev -- --host.

AxiosError: Network Error / GET http://localhost:5000/ net::ERR_CONNECTION_REFUSED

Backend is not reachable. Start server and confirm http://localhost:5000 returns a response.

Confirm VITE_API_URL matches server address.

Socket auth errors

If tokens are missing or invalid the server will still accept as anonymous by default (if you used fallback), or reject. Ensure the auth object in client socket options contains the JWT:

const socket = io(SOCKET_URL + '/chat', { auth: { token }})

Next steps / optional improvements

Add Cloudinary or S3 upload route and wire it to the client to support image/file sharing.

Implement message reactions and a reactions endpoint.

Add message edit/delete with permissions.

Add message search API (MongoDB text indexes).

Add integration tests (Jest + Supertest) and end-to-end tests (Cypress).

Dockerize server + client and provide a production docker-compose.yml.

Example development workflow

Start MongoDB (if using DB).

Start server:

cd server
npm run dev


Start client:

cd client
npm run dev


Open browser: http://localhost:5173

Register a user, open another browser / device, login, test sending messages and DMs.

Useful commands

Install server deps: cd server && npm install

Install client deps: cd client && npm install

Start server (dev): cd server && npm run dev

Start client (dev): cd client && npm run dev

Build client: cd client && npm run build
