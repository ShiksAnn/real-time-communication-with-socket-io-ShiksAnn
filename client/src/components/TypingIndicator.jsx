export default function TypingIndicator({ users }) {
  if (!users || users.length === 0) return null;
  return <div className="text-sm text-gray-500">{users.join(', ')} typing...</div>;
}
