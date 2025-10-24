import React, { useEffect, useState } from "react";

export default function NotificationsBell() {
  const [items, setItems] = useState<any[]>([]);
  async function load() {
    try {
      const res = await fetch("/api/me/notifications");
      const data = await res.json();
      if (data.ok) setItems(data.items || []);
    } catch {}
  }
  useEffect(() => { load(); }, []);

  const unread = items.filter(i => !i.is_read).length;

  return (
    <div className="relative">
      <span className="material-icons">notifications</span>
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 text-xs px-1 rounded bg-red-600 text-white">
          {unread}
        </span>
      )}
    </div>
  );
}
