import { useEffect, useRef, useState } from 'react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';

export default function ChatWindow({ socket, room, me, privateTarget }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const scroller = useRef();
  const loadingMore = useRef(false);

  // auto scroll
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const ns = socket; // socket is an instance connected to /chat

    // join room
    if (room) {
      ns.emit('join-room', { room });
    }

    function onRoomHistory(history) {
      setMessages(history);
    }

    function onNewMessage(m) {
      // optional: play sound or browser notification
      setMessages(prev => [...prev, m]);
      setUnreadCount(c => c + 1);
      // try marking read immediately
      ns.emit('mark-read', { messageId: m.id });
    }

    function onTyping({ username, isTyping }) {
      setTypingUsers(prev => {
        if (isTyping) {
          if (!prev.includes(username)) return [...prev, username];
          return prev;
        } else {
          return prev.filter(u => u !== username);
        }
      });
    }

    ns.on('room-history', onRoomHistory);
    ns.on('new-message', onNewMessage);
    ns.on('typing', onTyping);

    // pagination ack
    ns.on('connect', () => console.log('Reconnected to socket'));

    return () => {
      ns.off('room-history', onRoomHistory);
      ns.off('new-message', onNewMessage);
      ns.off('typing', onTyping);
    };
  }, [socket, room]);

  // send message
  const send = () => {
    if (!input.trim()) return;
    const payload = { room: privateTarget ? `private:${[me.id, privateTarget.id].sort().join(':')}` : room || 'global', content: input };
    socket.emit('send-message', payload, (ack) => {
      if (ack?.status === 'ok') {
        // optimistic UI already handled via server echo
      }
    });
    setInput('');
    socket.emit('typing', { room: payload.room, isTyping: false });
  };

  // typing events
  useEffect(() => {
    const to = setTimeout(() => socket?.emit('typing', { room: room || 'global', isTyping: false }), 800);
    return () => clearTimeout(to);
  }, []);

  const handleInput = (e) => {
    setInput(e.target.value);
    socket?.emit('typing', { room: room || 'global', isTyping: e.target.value.length > 0 });
  };

  // load more on scroll top
  const onScroll = async (e) => {
    if (e.target.scrollTop === 0 && messages.length && !loadingMore.current) {
      loadingMore.current = true;
      const before = messages[0].createdAt;
      socket.emit('load-more', { room: room || 'global', before }, (res) => {
        if (res?.status === 'ok') {
          setMessages(prev => [...res.messages, ...prev]);
        }
        loadingMore.current = false;
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b">Room: {privateTarget ? `DM with ${privateTarget.username}` : room}</div>
      <div className="flex-1 overflow-auto p-4" ref={scroller} onScroll={onScroll}>
        {messages.map(m => (
          <Message key={m.id} m={m} mine={m.sender?.id === me?.id} />
        ))}
      </div>
      <div className="p-4 border-t">
        <TypingIndicator users={typingUsers} />
        <div className="flex gap-2">
          <input value={input} onChange={handleInput} className="flex-1 p-2 border rounded" placeholder="Type a message" />
          <button onClick={send} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
        </div>
      </div>
    </div>
  );
}
