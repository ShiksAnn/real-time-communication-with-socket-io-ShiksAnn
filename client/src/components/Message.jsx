export default function Message({ m, mine }) {
  return (
    <div className={`message flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs p-2 rounded ${mine ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
        <div className="text-xs text-gray-700 font-semibold">{m.sender?.username || 'System'}</div>
        <div className="mt-1 break-words">{m.content}</div>
        <div className="text-right text-xs text-gray-400">{new Date(m.createdAt).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
