import { useEffect, useState } from "react";

export default function NotifBell() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let alive = true;
    fetch("/api/me/notifications")
      .then(r => r.json())
      .then(data => {
        if (alive && data.ok) {
          const unread = data.items?.filter((item: any) => !item.is_read).length || 0;
          setCount(unread);
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  
  return (
    <div className="relative" title="התראות">
      <span className="text-2xl">🔔</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 text-xs bg-red-600 text-white rounded-full px-1 min-w-[18px] h-[18px] flex items-center justify-center">
          {count}
        </span>
      )}
    </div>
  );
}
