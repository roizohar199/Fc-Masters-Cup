/**
 * Presence API routes - works with both Redis and Memory drivers
 * Handles heartbeat and leave signals for user presence tracking
 */

import type { Request, Response } from "express";
import { Router } from "express";
import { presence } from "../presence/index.js";
import { logger } from "../logger.js";

const router = Router();

/**
 * POST /api/presence/beat
 * Client sends heartbeat to maintain presence
 */
router.post("/beat", async (req: Request, res: Response) => {
  try {
    const { userId, tournamentId, sessionId } = req.body || {};
    
    if (!userId) {
      return res.status(400).json({ error: "missing userId" });
    }

    const sessionKey = sessionId || crypto.randomUUID();
    
    // Use the presence driver (Redis or Memory)
    await presence.beat(userId, sessionKey, tournamentId);
    
    logger.debug("presence", `Heartbeat from user ${userId}, session ${sessionKey}, tournament ${tournamentId}`);
    
    return res.json({ 
      ok: true, 
      ttl: 60,
      sessionId: sessionKey,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error("presence", "Error handling heartbeat", error);
    return res.status(500).json({ error: "internal_error" });
  }
});

/**
 * POST /api/presence/leave
 * Client sends leave signal (best-effort)
 */
router.post("/leave", async (req: Request, res: Response) => {
  try {
    const { userId, sessionId, reason } = req.body || {};
    
    if (userId) {
      const sessionKey = sessionId || "default";
      
      // Use the presence driver (Redis or Memory)
      await presence.leave(userId, sessionKey);
      
      logger.debug("presence", `Leave signal from user ${userId}, session ${sessionKey}, reason: ${reason}`);
    }
    
    return res.json({ ok: true });
  } catch (error) {
    logger.error("presence", "Error handling leave", error);
    return res.status(500).json({ error: "internal_error" });
  }
});

/**
 * GET /api/admin/users/online-status
 * Get online status for all users (admin endpoint)
 */
router.get("/admin/users/online-status", async (req: Request, res: Response) => {
  try {
    const onlineUsers = await presence.onlineUsers();
    
    logger.debug("presence", `Online status: ${onlineUsers.length} users`);
    
    return res.json({ 
      onlineUsers,
      total: onlineUsers.length,
      ttlSec: 60,
      lastUpdated: Date.now()
    });
  } catch (error) {
    logger.error("presence", "Error getting online status", error);
    return res.status(500).json({ error: "internal_error" });
  }
});

export { router as presenceApi };

