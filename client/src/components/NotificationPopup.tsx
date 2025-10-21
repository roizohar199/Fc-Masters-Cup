import { useEffect, useState } from "react";
import { apiGet, apiPatch, markAllNotificationsRead } from "../lib/api";

type Notification = {
  id: number; 
  title: string; 
  body: string; 
  kind: string; 
  is_read: 0|1;
};

export default function NotificationPopup() {
  const [n, setN] = useState<Notification|null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    apiGet<{notifications: Notification[]}>("/me/notifications").then(res => {
      if (!mounted) return;
      const first = res.notifications?.[0];
      if (first) { 
        setN(first); 
        setOpen(true); 
      }
    }).catch(()=>{});
    return () => { mounted = false; };
  }, []);

  if (!open || !n) return null;

  const onClose = async () => {
    try { 
      await apiPatch(`/me/notifications/${n.id}/read`, {}); 
    } catch {}
    setOpen(false);
  };

  const markAll = async () => {
    try { 
      await markAllNotificationsRead(); 
    } catch {}
    setOpen(false);
    setN(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 max-w-md w-[90%] shadow-xl" dir="rtl">
        <h3 className="text-xl font-bold mb-2">{n.title}</h3>
        <p className="mb-4">{n.body}</p>
        <div className="flex gap-2">
          <button 
            className="rounded-xl px-4 py-2 border hover:bg-gray-50 transition-colors" 
            onClick={onClose}
          >
            סגור
          </button>
          <button 
            className="rounded-xl px-4 py-2 border hover:bg-gray-50 transition-colors" 
            onClick={markAll}
          >
            סמן הכול כנקרא
          </button>
        </div>
      </div>
    </div>
  );
}
