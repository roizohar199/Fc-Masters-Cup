import { envDriver, type PresenceDriver } from "./driver.js";
import { MemoryPresence } from "./memoryPresence.js";
import { RedisPresence, initRedis } from "./redisPresence.js";

let driver: PresenceDriver = MemoryPresence;

export async function initPresence() {
  if (envDriver() === "redis") {
    try {
      await initRedis();
      driver = RedisPresence;
      console.log("[presence] using Redis");
    } catch (e) {
      console.warn("[presence] Redis init failed – falling back to memory:", e);
      driver = MemoryPresence;
    }
  } else {
    console.log("[presence] using Memory");
  }
}

export const presence = {
  beat: (...a: Parameters<PresenceDriver["beat"]>) => driver.beat(...a),
  leave: (...a: Parameters<PresenceDriver["leave"]>) => driver.leave(...a),
  onlineUsers: () => driver.onlineUsers(),
};

