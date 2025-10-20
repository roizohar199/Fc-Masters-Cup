import { createClient } from "redis";
import type { PresenceDriver } from "./driver.js";

const TTL_SEC = 60;
let client: ReturnType<typeof createClient> | null = null;
let loggedOnce = false;

function logOnce(msg: string, data?: unknown) {
  if (!loggedOnce) {
    console.warn(msg, data ?? "");
    loggedOnce = true;
  }
}

export async function initRedis(url = process.env.REDIS_URL || "redis://127.0.0.1:6379") {
  if (client) return client;
  try {
    const c = createClient({ url });
    c.on("error", (e: unknown) => {
      logOnce("[REDIS] connection error (falling back to memory)", e);
    });
    await c.connect(); // אם ייכשל -> ניפול ל-memory
    client = c;
    console.log("[REDIS] connected:", url);
  } catch (e: unknown) {
    logOnce("[REDIS] connect failed – using memory driver", e);
    client = null;
  }
  return client;
}

const key = (u: string, s?: string) => `presence:${u}:${s || "default"}`;

export const RedisPresence: PresenceDriver = {
  async beat(userId, sessionId, tournamentId) {
    const r = await initRedis();
    if (!r) return; // אין Redis – לא מפיל את השרת
    await r.setEx(key(userId, sessionId), TTL_SEC, tournamentId || "1");
  },
  async leave(userId, sessionId) {
    const r = await initRedis();
    if (!r) return;
    await r.del(key(userId, sessionId));
  },
  async onlineUsers() {
    const r = await initRedis();
    if (!r) return []; // במצב memory נפריד ל-driver אחר
    const set = new Set<string>();
    for await (const k of r.scanIterator({ MATCH: "presence:*", COUNT: 500 })) {
      const parts = String(k).split(":");
      if (parts[1]) set.add(parts[1]);
    }
    return Array.from(set);
  },
};
