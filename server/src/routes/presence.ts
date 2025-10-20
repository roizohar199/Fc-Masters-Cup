/**
 * Presence API routes
 * Handles heartbeat and leave signals for user presence tracking
 */

import { Router } from "express";
import { postBeat, postLeave, getOnlineStatus } from "../presence/presenceManager.js";

const router = Router();

/**
 * POST /api/presence/beat
 * Client sends heartbeat to maintain presence
 */
router.post("/beat", postBeat);

/**
 * POST /api/presence/leave
 * Client sends leave signal when leaving
 */
router.post("/leave", postLeave);

/**
 * GET /api/admin/users/online-status
 * Get online status for all users (admin only)
 */
router.get("/admin/users/online-status", getOnlineStatus);

export { router as presence };
