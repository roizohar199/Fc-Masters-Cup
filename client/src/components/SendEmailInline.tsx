import { useState } from "react";

async function postAdminEmail(userId: number, subject: string, html: string) {
  const r = await fetch(`/api/admin/users/${userId}/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ subject, html })
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export function SendEmailInline({ userId }: { userId: number }) {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);

  const onSend = async () => {
    setBusy(true); 
    setMsg(null);
    try {
      await postAdminEmail(userId, subject, html);
      setMsg("נשלח בהצלחה");
      setSubject(""); 
      setHtml("");
    } catch (e:any) {
      setMsg("שגיאה בשליחה: " + (e?.message || ""));
    } finally { 
      setBusy(false); 
    }
  };

  return (
    <div className="border rounded-xl p-3" dir="rtl" style={{ marginTop: 8 }}>
      <div className="mb-2 font-semibold">שליחת מייל למשתמש #{userId}</div>
      <input 
        className="border rounded p-2 w-full mb-2" 
        placeholder="נושא"
        value={subject} 
        onChange={e=>setSubject(e.target.value)} 
      />
      <textarea 
        className="border rounded p-2 w-full h-28 mb-2" 
        placeholder="תוכן HTML"
        value={html} 
        onChange={e=>setHtml(e.target.value)} 
      />
      <button 
        className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors" 
        onClick={onSend} 
        disabled={busy || !subject || !html}
      >
        {busy ? "שולח..." : "שלח"}
      </button>
      {msg && <div className="mt-2 text-sm">{msg}</div>}
    </div>
  );
}
