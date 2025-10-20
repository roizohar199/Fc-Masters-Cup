/**
 * Redis-based presence management with TTL
 * 
 * Solves the mobile disconnect issue by using Redis TTL instead of
 * relying on WebSocket disconnect events (which are unreliable on mobile).
 */

import type { Request, Response } from "express";
import { createClient } from "redis";
import { logger } from "../logger.js";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
export const redis = createClient({ url: REDIS_URL });

// Error handling
redis.on("error", (e) => {
  logger.error("redis", "Redis connection error", e);
});

// Connection events
redis.on("connect", () => {
  logger.info("redis", "Connected to Redis");
});

redis.on("ready", () => {
  logger.info("redis", "Redis client ready");
});

redis.on("end", () => {
  logger.warn("redis", "Redis connection ended");
});

// Connect to Redis
let isConnected = false;
async function ensureConnected() {
  if (!isConnected) {
    try {
      await redis.connect();
      isConnected = true;
      logger.info("redis", "Successfully connected to Redis");
    } catch (error) {
      logger.error("redis", "Failed to connect to Redis", error);
      throw error;
    }
  }
}

const TTL_SEC = 60; // User stays "online" for 60 seconds after last heartbeat

/**
 * Generate Redis key for user presence
 */
function key(userId: string, sessionId: string = "default"): string {
  return `presence:${userId}:${sessionId}`;
}

/**
 * POST /api/presence/beat
 * Client sends heartbeat to maintain presence
 */
export async function postBeat(req: Request, res: Response) {
  try {
    await ensureConnected();
    
    const { userId, tournamentId, sessionId } = req.body || {};
    
    if (!userId) {
      return res.status(400).json({ error: "missing userId" });
    }

    const sessionKey = sessionId || crypto.randomUUID();
    const redisKey = key(userId, sessionKey);
    
    // Set presence with TTL (automatically expires after TTL_SEC)
    await redis.setEx(redisKey, TTL_SEC, tournamentId || "1");
    
    logger.debug("presence", `Heartbeat from user ${userId}, session ${sessionKey}, tournament ${tournamentId}`);
    
    return res.json({ 
      ok: true, 
      ttl: TTL_SEC,
      sessionId: sessionKey,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error("presence", "Error handling heartbeat", error);
    return res.status(500).json({ error: "internal_error" });
  }
}

/**
 * POST /api/presence/leave
 * Client sends leave signal (best-effort)
 */
export async function postLeave(req: Request, res: Response) {
  try {
    await ensureConnected();
    
    const { userId, sessionId, reason } = req.body || {};
    
    if (userId) {
      const sessionKey = sessionId || "default";
      const redisKey = key(userId, sessionKey);
      
      // Delete presence immediately
      const wasPresent = await redis.del(redisKey);
      
      logger.debug("presence", `Leave signal from user ${userId}, session ${sessionKey}, reason: ${reason}, was present: ${wasPresent > 0}`);
    }
    
    return res.json({ ok: true });
  } catch (error) {
    logger.error("presence", "Error handling leave", error);
    return res.status(500).json({ error: "internal_error" });
  }
}

/**
 * GET /api/admin/users/online-status
 * Get online status for all users (admin endpoint)
 */
export async function getOnlineStatus(req: Request, res: Response) {
  try {
    await ensureConnected();
    
    const onlineByUser = new Set<string>();
    const userSessions = new Map<string, number>(); // userId -> session count
    
    // Scan Redis for all presence keys
    const pattern = "presence:*";
    let cursor = "0";
    
    do {
      const result = await redis.scan(cursor, { 
        MATCH: pattern, 
        COUNT: 500 
      });
      cursor = result.cursor;
      const keys = result.keys;
      
      for (const k of keys) {
        const parts = k.split(":"); // ["presence", userId, sessionId]
        const userId = parts[1];
        if (userId) {
          onlineByUser.add(userId);
          userSessions.set(userId, (userSessions.get(userId) || 0) + 1);
        }
      }
    } while (cursor !== "0");
    
    const onlineUsers = Array.from(onlineByUser);
    const totalSessions = Array.from(userSessions.values()).reduce((sum, count) => sum + count, 0);
    
    logger.debug("presence", `Online status: ${onlineUsers.length} users, ${totalSessions} sessions`);
    
    return res.json({ 
      onlineUsers,
      total: onlineUsers.length,
      totalSessions,
      ttlSec: TTL_SEC,
      lastUpdated: Date.now(),
      byUser: Object.fromEntries(userSessions) // For debugging
    });
  } catch (error) {
    logger.error("presence", "Error getting online status", error);
    return res.status(500).json({ error: "internal_error" });
  }
}

/**
 * Check if a specific user is online
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user is online
 */
export async function isUserOnline(userId: string): Promise<boolean> {
  try {
    await ensureConnected();
    
    const pattern = `presence:${userId}:*`;
    const iter = redis.scanIterator({ 
      MATCH: pattern, 
      COUNT: 100 
    });
    
    for await (const _ of iter) {
      return true; // Found at least one active session
    }
    
    return false;
  } catch (error) {
    logger.error("presence", "Error checking user online status", error);
    return false;
  }
}

/**
 * Get online users for a specific tournament
 * @param tournamentId - Tournament ID to filter by
 * @returns Promise<string[]> - Array of online user IDs
 */
export async function getTournamentOnlineUsers(tournamentId: string): Promise<string[]> {
  try {
    await ensureConnected();
    
    const onlineUsers = new Set<string>();
    const pattern = "presence:*";
    let cursor = "0";
    
    do {
      const result = await redis.scan(cursor, { 
        MATCH: pattern, 
        COUNT: 500 
      });
      cursor = result.cursor;
      const keys = result.keys;
      
      for (const k of keys) {
        const parts = k.split(":"); // ["presence", userId, sessionId]
        const userId = parts[1];
        if (userId) {
          // Check if this session is for the specific tournament
          const tournament = await redis.get(k);
          if (tournament === tournamentId) {
            onlineUsers.add(userId);
          }
        }
      }
    } while (cursor !== "0");
    
    return Array.from(onlineUsers);
  } catch (error) {
    logger.error("presence", "Error getting tournament online users", error);
    return [];
  }
}

/**
 * Get presence statistics
 * @returns Promise<object> - Presence statistics
 */
export async function getPresenceStats() {
  try {
    await ensureConnected();
    
    const stats = {
      totalSessions: 0,
      activeUsers: 0,
      ttlSec: TTL_SEC,
      timestamp: Date.now()
    };
    
    const userSet = new Set<string>();
    const pattern = "presence:*";
    let cursor = "0";
    
    do {
      const result = await redis.scan(cursor, { 
        MATCH: pattern, 
        COUNT: 500 
      });
      cursor = result.cursor;
      const keys = result.keys;
      
      stats.totalSessions += keys.length;
      
      for (const k of keys) {
        const parts = k.split(":"); // ["presence", userId, sessionId]
        const userId = parts[1];
        if (userId) {
          userSet.add(userId);
        }
      }
    } while (cursor !== "0");
    
    stats.activeUsers = userSet.size;
    
    return stats;
  } catch (error) {
    logger.error("presence", "Error getting presence stats", error);
    return {
      totalSessions: 0,
      activeUsers: 0,
      ttlSec: TTL_SEC,
      timestamp: Date.now(),
      error: "Failed to get stats"
    };
  }
}

/**
 * Cleanup function - can be called on server shutdown
 */
export async function cleanup() {
  try {
    if (isConnected) {
      await redis.quit();
      isConnected = false;
      logger.info("redis", "Redis connection closed");
    }
  } catch (error) {
    logger.error("redis", "Error closing Redis connection", error);
  }
}
