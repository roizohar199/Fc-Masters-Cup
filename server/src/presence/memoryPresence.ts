import type { PresenceDriver } from "./driver.js";

type K = string; // userId:sessionId
const TTL = 60_000; // 60s
const map = new Map<K, number>();
const key = (u: string, s?: string) => `${u}:${s || "default"}`;

export const MemoryPresence: PresenceDriver = {
  async beat(userId, sessionId) {
    map.set(key(userId, sessionId), Date.now());
  },
  async leave(userId, sessionId) {
    map.delete(key(userId, sessionId));
  },
  async onlineUsers() {
    const now = Date.now();
    const keep = new Set<string>();
    for (const [k, ts] of map.entries()) {
      if (now - ts <= TTL) keep.add(k.split(":")[0]);
      else map.delete(k);
    }
    return Array.from(keep);
  },
};

