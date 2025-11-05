import { useEffect, useState } from 'react';

export default function Sidebar({ socket, onSelectRoom, onlineUsers, me, onSelectPrivate }) {
  const [rooms, setRooms] = useState([{ name: 'global', id: 'global' }]);

  useEffect(() => {
    // fetch public rooms if needed
    async function fetchRooms() {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/rooms');
        const data = await res.json();
        setRooms(prev => [...prev, ...data.map(r => ({ id: r._id, name: r.name }))]);
      } catch (err) { /* ignore */ }
    }
    fetchRooms();
  }, []);

  return (
    <div className="w-64 border-r h-full p-4 flex flex-col gap-4">
      <div className="font-bold">Rooms</div>
      <div className="flex flex-col gap-2">
        {rooms.map(r => (
          <button key={r.id} className="text-left" onClick={() => onSelectRoom(r.id)}>{r.name}</button>
        ))}
      </div>
      <div className="mt-6 font-bold">Online</div>
      <div className="flex-1 overflow-auto">
        {onlineUsers.map(u => (
          <div key={u.id} className="flex justify-between items-center py-1">
            <div>{u.username}</div>
            <button className="text-sm" onClick={() => onSelectPrivate(u)}>PM</button>
          </div>
        ))}
      </div>
      <div className="text-sm text-gray-500">You: {me?.username}</div>
    </div>
  );
}
