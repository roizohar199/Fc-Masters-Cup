// client/src/utils/ws.ts
export function getPresenceWsUrl(): string {
  const isProd =
    location.hostname !== 'localhost' &&
    location.hostname !== '127.0.0.1';

  // תמיכה במשתני סביבה אם מוגדרים
  if (isProd && import.meta.env.VITE_WS_URL_PROD) {
    return import.meta.env.VITE_WS_URL_PROD as string;
  }
  
  if (!isProd && import.meta.env.VITE_WS_URL_DEV) {
    return import.meta.env.VITE_WS_URL_DEV as string;
  }

  // fallback ללוגיקה הקיימת
  if (isProd) {
    // בפרודקשן: ללא פורט! Nginx על 443 מטפל בפרוקסי
    return `wss://${location.host}/presence`;
  }

  // בפיתוח: השרת מאזין על 8787
  return `ws://localhost:8787/presence`;
}

export function createPresenceSocket(): WebSocket {
  const url = getPresenceWsUrl();
  console.log(`🔌 Creating WebSocket connection to: ${url}`);
  const ws = new WebSocket(url);
  return ws;
}
