/**
 * Server-side presence management with TTL + Sweeper
 * 
 * Tracks user presence using heartbeat + TTL instead of relying
 * only on WebSocket disconnect events (which are unreliable on mobile).
 */

import type { Request, Response } from "express";
import { logger } from "../logger.js";

type SessionKey = string; // userId:sessionId
type Presence = { 
  userId: string; 
  tournamentId?: string; 
  lastSeen: number;
  sessionId: string;
};

const ONLINE_TTL_MS = 60_000;     // User is "online" if we got a beat in last 60 seconds
const SWEEP_EVERY_MS = 30_000;    // Clean up every 30 seconds

const presenceMap = new Map<SessionKey, Presence>();

/**
 * Generate session key
 */
function key(userId: string, sessionId: string): string {
  return `${userId}:${sessionId}`;
}

/**
 * Get current timestamp
 */
function now(): number {
  return Date.now();
}

/**
 * Handle heartbeat from client
 */
export function postBeat(req: Request, res: Response) {
  try {
    const { userId, tournamentId, sessionId } = req.body || {};
    
    if (!userId) {
      return res.status(400).json({ error: "missing userId" });
    }

    const sessionKey = key(userId, sessionId || "default");
    const presence: Presence = { 
      userId, 
      tournamentId, 
      lastSeen: now(),
      sessionId: sessionId || "default"
    };
    
    presenceMap.set(sessionKey, presence);
    
    logger.debug("presence", `Heartbeat from user ${userId}, session ${sessionId}`);
    
    return res.json({ 
      ok: true, 
      timestamp: presence.lastSeen,
      ttl: ONLINE_TTL_MS 
    });
  } catch (error) {
    logger.error("presence", "Error handling heartbeat", error);
    return res.status(500).json({ error: "internal error" });
  }
}

/**
 * Handle leave signal from client
 */
export function postLeave(req: Request, res: Response) {
  try {
    const { userId, sessionId, reason } = req.body || {};
    
    if (userId) {
      const sessionKey = key(userId, sessionId || "default");
      const wasPresent = presenceMap.has(sessionKey);
      presenceMap.delete(sessionKey);
      
      logger.debug("presence", `Leave signal from user ${userId}, session ${sessionId}, reason: ${reason}, was present: ${wasPresent}`);
    }
    
    return res.json({ ok: true });
  } catch (error) {
    logger.error("presence", "Error handling leave", error);
    return res.status(500).json({ error: "internal error" });
  }
}

/**
 * Get online status for all users (admin endpoint)
 */
export function getOnlineStatus(req: Request, res: Response) {
  try {
    const byUser = new Map<string, { lastSeen: number; sessions: number }>();
    const t = now();
    
    // Count active sessions per user
    for (const { userId, lastSeen, sessionId } of presenceMap.values()) {
      if (t - lastSeen <= ONLINE_TTL_MS) {
        const existing = byUser.get(userId);
        if (existing) {
          existing.lastSeen = Math.max(existing.lastSeen, lastSeen);
          existing.sessions++;
        } else {
          byUser.set(userId, { lastSeen, sessions: 1 });
        }
      }
    }
    
    const onlineUsers = Array.from(byUser.keys());
    const totalSessions = Array.from(byUser.values()).reduce((sum, user) => sum + user.sessions, 0);
    
    logger.debug("presence", `Online status: ${onlineUsers.length} users, ${totalSessions} sessions`);
    
    res.json({
      onlineUsers,
      total: onlineUsers.length,
      totalSessions,
      ttlMs: ONLINE_TTL_MS,
      lastUpdated: t,
      byUser: Object.fromEntries(byUser) // For debugging
    });
  } catch (error) {
    logger.error("presence", "Error getting online status", error);
    res.status(500).json({ error: "internal error" });
  }
}

/**
 * Check if a specific user is online
 */
export function isUserOnline(userId: string): boolean {
  const t = now();
  
  for (const { userId: uid, lastSeen } of presenceMap.values()) {
    if (uid === userId && t - lastSeen <= ONLINE_TTL_MS) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get online users for a specific tournament
 */
export function getTournamentOnlineUsers(tournamentId: string): string[] {
  const t = now();
  const users = new Set<string>();
  
  for (const { userId, tournamentId: tid, lastSeen } of presenceMap.values()) {
    if (tid === tournamentId && t - lastSeen <= ONLINE_TTL_MS) {
      users.add(userId);
    }
  }
  
  return Array.from(users);
}

/**
 * Get presence statistics
 */
export function getPresenceStats() {
  const t = now();
  let activeSessions = 0;
  let activeUsers = new Set<string>();
  
  for (const { userId, lastSeen } of presenceMap.values()) {
    if (t - lastSeen <= ONLINE_TTL_MS) {
      activeSessions++;
      activeUsers.add(userId);
    }
  }
  
  return {
    totalSessions: presenceMap.size,
    activeSessions,
    activeUsers: activeUsers.size,
    ttlMs: ONLINE_TTL_MS
  };
}

/**
 * Cleanup expired sessions
 */
function sweepExpiredSessions() {
  const t = now();
  let removed = 0;
  
  for (const [key, { userId, lastSeen }] of presenceMap.entries()) {
    if (t - lastSeen > ONLINE_TTL_MS) {
      presenceMap.delete(key);
      removed++;
    }
  }
  
  if (removed > 0) {
    logger.debug("presence", `Swept ${removed} expired sessions`);
  }
}

/**
 * Start the sweeper
 */
export function startPresenceSweeper() {
  setInterval(sweepExpiredSessions, SWEEP_EVERY_MS);
  logger.info("presence", `Presence sweeper started (every ${SWEEP_EVERY_MS}ms, TTL: ${ONLINE_TTL_MS}ms)`);
}

/**
 * Get all presence data (for debugging)
 */
export function getAllPresenceData() {
  return {
    sessions: Array.from(presenceMap.entries()),
    stats: getPresenceStats(),
    timestamp: now()
  };
}
