import { envDriver, type PresenceDriver } from "./driver.js";
import { MemoryPresence } from "./memoryPresence.js";
import { RedisPresence, initRedis } from "./redisPresence.js";

let driver: PresenceDriver = MemoryPresence;

export async function initPresence() {
  if (envDriver() === "redis") {
    await initRedis();
    // אם החיבור הצליח – נשתמש ב-RedisPresence, אחרת נישאר על Memory
    try {
      // בדיקה מהירה: אם client מחובר יצליח לקרוא scanIterator ללא שגיאה
      driver = RedisPresence;
      console.log("[presence] driver: redis");
    } catch {
      driver = MemoryPresence;
      console.log("[presence] driver: memory (redis unavailable)");
    }
  } else {
    driver = MemoryPresence;
    console.log("[presence] driver: memory (by env)");
  }
}

export const presence = {
  beat: (...a: Parameters<PresenceDriver["beat"]>) => driver.beat(...a),
  leave: (...a: Parameters<PresenceDriver["leave"]>) => driver.leave(...a),
  onlineUsers: () => driver.onlineUsers(),
};

