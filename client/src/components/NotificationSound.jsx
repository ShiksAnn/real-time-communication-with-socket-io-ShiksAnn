import { useEffect, useRef } from 'react';

export default function NotificationSound({ play }) {
  const audioRef = useRef(null);
  useEffect(() => {
    if (play && audioRef.current) audioRef.current.play().catch(()=>{});
  }, [play]);
  return <audio ref={audioRef} src="/notification.mp3" />;
}
