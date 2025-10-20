import { createClient } from "redis";
import type { PresenceDriver } from "./driver.js";

const TTL_SEC = 60;

let client: ReturnType<typeof createClient> | null = null;

export async function initRedis(url = process.env.REDIS_URL || "redis://127.0.0.1:6379") {
  if (client) return client;
  const c = createClient({ url });
  c.on("error", (e: unknown) => console.error("[REDIS] error", e));
  await c.connect();
  client = c;
  return client;
}

function getClient() {
  if (!client) throw new Error("Redis not initialized");
  return client;
}

const key = (u: string, s?: string) => `presence:${u}:${s || "default"}`;

export const RedisPresence: PresenceDriver = {
  async beat(userId, sessionId, tournamentId) {
    await initRedis();
    await getClient().setEx(key(userId, sessionId), TTL_SEC, tournamentId || "1");
  },
  async leave(userId, sessionId) {
    await initRedis();
    await getClient().del(key(userId, sessionId));
  },
  async onlineUsers() {
    await initRedis();
    const set = new Set<string>();
    for await (const k of getClient().scanIterator({ MATCH: "presence:*", COUNT: 500 })) {
      const parts = String(k).split(":");
      if (parts[1]) set.add(parts[1]);
    }
    return Array.from(set);
  },
};
