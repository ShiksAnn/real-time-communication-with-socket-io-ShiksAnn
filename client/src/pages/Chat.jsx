import { useEffect, useState } from 'react';
import socket from "../socket/socket";
import API from '../api/api';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import NotificationSound from '../components/NotificationSound';
import { useNavigate } from 'react-router-dom';

export default function Chat() {
  const [me, setMe] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [room, setRoom] = useState('global');
  const [privateTarget, setPrivateTarget] = useState(null);
  const token = localStorage.getItem('token');
  const { socketRef } = useSocket(token);
  const socket = socketRef.current;
  const navigate = useNavigate();
  const [playNotif, setPlayNotif] = useState(false);

  useEffect(() => {
    if (!token) navigate('/');
    (async ()=>{
      try {
        const res = await API.get('/auth/me');
        setMe(res.data.user);
      } catch (err) { localStorage.removeItem('token'); navigate('/'); }
    })();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onOnline = (users) => setOnlineUsers(users);
    const onNewMessage = (msg) => { setPlayNotif(true); setTimeout(()=>setPlayNotif(false), 800); };

    socket.on('online-users', onOnline);
    socket.on('new-message', onNewMessage);
    socket.on('private-message', onNewMessage);

    return () => {
      socket.off('online-users', onOnline);
      socket.off('new-message', onNewMessage);
      socket.off('private-message', onNewMessage);
    };
  }, [socket]);

  const handleSelectRoom = (roomId) => { setPrivateTarget(null); setRoom(roomId); socket?.emit('join-room', { room: roomId }); };
  const handleSelectPrivate = (user) => { setPrivateTarget(user); setRoom(null); /* join private room logic done when sending */ };

  return (
    <div className="min-h-screen flex">
      <NotificationSound play={playNotif} />
      <Sidebar socket={socket} onSelectRoom={handleSelectRoom} onlineUsers={onlineUsers} me={me} onSelectPrivate={handleSelectPrivate} />
      <ChatWindow socket={socket} room={room} me={me} privateTarget={privateTarget} />
    </div>
  );
}
