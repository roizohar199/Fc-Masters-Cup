import { Router } from "express";
import { randomUUID } from "node:crypto";
import db from "../db.js";
import { logger } from "../logger.js";
import { broadcastEvent } from "../presence.js";

export const draw = Router();

// Helper: broadcast draw event to all connected clients via WebSocket
function broadcastDrawEvent(event: string, data: any) {
  broadcastEvent(event, data);
  logger.info("draw", `Broadcasting event: ${event}`, data);
}

/**
 * POST /api/draw/start
 * Start a new draw ceremony for a tournament round
 * Admin only
 */
draw.post("/start", async (req, res) => {
  try {
    const { tournamentId, round } = req.body;
    const user = (req as any).user;

    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return res.status(403).json({ error: "Admin access required" });
    }

    if (!tournamentId || !round) {
      return res.status(400).json({ error: "Tournament ID and round required" });
    }

    // Validate round
    if (!["R16", "QF", "SF"].includes(round)) {
      return res.status(400).json({ error: "Invalid round. Must be R16, QF, or SF" });
    }

    // Get tournament
    const tournament = db
      .prepare("SELECT * FROM tournaments WHERE id = ?")
      .get(tournamentId) as any;

    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    // Check if there's already an active draw for this tournament/round
    const existingDraw = db
      .prepare(
        "SELECT * FROM tournament_draws WHERE tournamentId = ? AND round = ? AND stage != 'completed'"
      )
      .get(tournamentId, round) as any;

    if (existingDraw) {
      return res.json(existingDraw);
    }

    // Get registered players for this tournament
    const registrations = db
      .prepare(
        `SELECT tr.userId, u.email, u.psnUsername 
         FROM tournament_registrations tr 
         JOIN users u ON tr.userId = u.id 
         WHERE tr.tournamentId = ? AND tr.state = 'registered'`
      )
      .all(tournamentId) as any[];

    const requiredPlayers = round === "R16" ? 16 : round === "QF" ? 8 : 4;

    if (registrations.length < requiredPlayers) {
      return res.status(400).json({
        error: `Not enough registered players. Need ${requiredPlayers}, have ${registrations.length}`,
      });
    }

    // Take the first N players (could be randomized here)
    const players = registrations.slice(0, requiredPlayers).map((r) => ({
      id: r.userId,
      name: r.psnUsername || r.email.split("@")[0],
      email: r.email,
    }));

    // Create draw
    const drawId = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO tournament_draws (
        id, tournamentId, round, stage, currentPick, 
        pairings, spinPool, currentPair, createdBy, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      drawId,
      tournamentId,
      round,
      "waiting",
      0,
      JSON.stringify([]),
      JSON.stringify(players),
      JSON.stringify([]),
      user.email,
      now
    );

    const draw = {
      id: drawId,
      tournamentId,
      round,
      stage: "waiting",
      currentPick: 0,
      pairings: [],
      spinPool: players,
      currentPair: [],
      createdBy: user.email,
      createdAt: now,
    };

    // Broadcast to all clients
    broadcastDrawEvent("draw:started", draw);

    logger.info("draw", `Draw started for ${tournamentId} round ${round} by ${user.email}`);

    res.json(draw);
  } catch (error: any) {
    logger.error("draw", "Failed to start draw", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/draw/:drawId/spin
 * Perform a spin to select a player
 * Admin only
 */
draw.post("/:drawId/spin", async (req, res) => {
  try {
    const { drawId } = req.params;
    const user = (req as any).user;

    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const drawData = db
      .prepare("SELECT * FROM tournament_draws WHERE id = ?")
      .get(drawId) as any;

    if (!drawData) {
      return res.status(404).json({ error: "Draw not found" });
    }

    if (drawData.stage === "completed") {
      return res.status(400).json({ error: "Draw already completed" });
    }

    const spinPool = JSON.parse(drawData.spinPool);
    const currentPair = JSON.parse(drawData.currentPair);

    if (spinPool.length === 0) {
      return res.status(400).json({ error: "No players left in pool" });
    }

    // Select random player
    const randomIndex = Math.floor(Math.random() * spinPool.length);
    const selectedPlayer = spinPool[randomIndex];

    // Remove from pool
    const newPool = spinPool.filter((_: any, i: number) => i !== randomIndex);

    // Add to current pair
    const newPair = [...currentPair, selectedPlayer];

    // Update draw
    db.prepare(
      "UPDATE tournament_draws SET spinPool = ?, currentPair = ?, currentPick = ?, stage = ? WHERE id = ?"
    ).run(
      JSON.stringify(newPool),
      JSON.stringify(newPair),
      drawData.currentPick + 1,
      "spinning",
      drawId
    );

    const updatedDraw = {
      id: drawId,
      tournamentId: drawData.tournamentId,
      round: drawData.round,
      stage: "spinning",
      currentPick: drawData.currentPick + 1,
      spinPool: newPool,
      currentPair: newPair,
      selectedPlayer,
    };

    // Broadcast
    broadcastDrawEvent("draw:spin", updatedDraw);

    res.json(updatedDraw);
  } catch (error: any) {
    logger.error("draw", "Failed to spin", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/draw/:drawId/lock-pair
 * Lock the current pair as a match
 * Admin only
 */
draw.post("/:drawId/lock-pair", async (req, res) => {
  try {
    const { drawId } = req.params;
    const user = (req as any).user;

    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const drawData = db
      .prepare("SELECT * FROM tournament_draws WHERE id = ?")
      .get(drawId) as any;

    if (!drawData) {
      return res.status(404).json({ error: "Draw not found" });
    }

    const currentPair = JSON.parse(drawData.currentPair);
    const pairings = JSON.parse(drawData.pairings);

    if (currentPair.length !== 2) {
      return res.status(400).json({ error: "Need exactly 2 players to lock pair" });
    }

    // Add pair to pairings
    const newPairings = [...pairings, { a: currentPair[0], b: currentPair[1] }];

    // Clear current pair
    db.prepare(
      "UPDATE tournament_draws SET pairings = ?, currentPair = ?, stage = ? WHERE id = ?"
    ).run(JSON.stringify(newPairings), JSON.stringify([]), "idle", drawId);

    const updatedDraw = {
      id: drawId,
      tournamentId: drawData.tournamentId,
      round: drawData.round,
      stage: "idle",
      currentPick: drawData.currentPick,
      pairings: newPairings,
      currentPair: [],
    };

    // Broadcast
    broadcastDrawEvent("draw:pair-locked", updatedDraw);

    res.json(updatedDraw);
  } catch (error: any) {
    logger.error("draw", "Failed to lock pair", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/draw/:drawId/complete
 * Complete the draw and create matches
 * Admin only
 */
draw.post("/:drawId/complete", async (req, res) => {
  try {
    const { drawId } = req.params;
    const user = (req as any).user;

    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const drawData = db
      .prepare("SELECT * FROM tournament_draws WHERE id = ?")
      .get(drawId) as any;

    if (!drawData) {
      return res.status(404).json({ error: "Draw not found" });
    }

    const pairings = JSON.parse(drawData.pairings);

    if (pairings.length === 0) {
      return res.status(400).json({ error: "No pairings to create matches from" });
    }

    // Create matches for each pairing
    const now = new Date().toISOString();
    for (const pair of pairings) {
      const matchId = randomUUID();
      const token = Math.random().toString(36).slice(2, 14);
      const pin = Math.random().toString(36).slice(2, 8).toUpperCase();

      db.prepare(
        `INSERT INTO matches (
          id, tournamentId, round, homeId, awayId, 
          homeScore, awayScore, status, token, pin, 
          evidenceHome, evidenceAway, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        matchId,
        drawData.tournamentId,
        drawData.round,
        pair.a.id,
        pair.b.id,
        null,
        null,
        "PENDING",
        token,
        pin,
        null,
        null,
        now
      );
    }

    // Mark draw as completed
    db.prepare(
      "UPDATE tournament_draws SET stage = ?, completedAt = ? WHERE id = ?"
    ).run("completed", now, drawId);

    const completedDraw = {
      id: drawId,
      tournamentId: drawData.tournamentId,
      round: drawData.round,
      stage: "completed",
      pairings,
      completedAt: now,
    };

    // Broadcast
    broadcastDrawEvent("draw:completed", completedDraw);

    logger.info("draw", `Draw completed for ${drawData.tournamentId} round ${drawData.round}`);

    res.json(completedDraw);
  } catch (error: any) {
    logger.error("draw", "Failed to complete draw", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/draw/:drawId
 * Get current draw state
 * Public (for viewing)
 */
draw.get("/:drawId", async (req, res) => {
  try {
    const { drawId } = req.params;

    const drawData = db
      .prepare("SELECT * FROM tournament_draws WHERE id = ?")
      .get(drawId) as any;

    if (!drawData) {
      return res.status(404).json({ error: "Draw not found" });
    }

    const draw = {
      id: drawData.id,
      tournamentId: drawData.tournamentId,
      round: drawData.round,
      stage: drawData.stage,
      currentPick: drawData.currentPick,
      pairings: JSON.parse(drawData.pairings || "[]"),
      spinPool: JSON.parse(drawData.spinPool || "[]"),
      currentPair: JSON.parse(drawData.currentPair || "[]"),
      createdBy: drawData.createdBy,
      createdAt: drawData.createdAt,
      completedAt: drawData.completedAt,
    };

    res.json(draw);
  } catch (error: any) {
    logger.error("draw", "Failed to get draw", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/draw/tournament/:tournamentId
 * Get active draw for a tournament
 * Public (for viewing)
 */
draw.get("/tournament/:tournamentId", async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const drawData = db
      .prepare(
        "SELECT * FROM tournament_draws WHERE tournamentId = ? ORDER BY createdAt DESC LIMIT 1"
      )
      .get(tournamentId) as any;

    if (!drawData) {
      return res.status(404).json({ error: "No draw found for this tournament" });
    }

    const draw = {
      id: drawData.id,
      tournamentId: drawData.tournamentId,
      round: drawData.round,
      stage: drawData.stage,
      currentPick: drawData.currentPick,
      pairings: JSON.parse(drawData.pairings || "[]"),
      spinPool: JSON.parse(drawData.spinPool || "[]"),
      currentPair: JSON.parse(drawData.currentPair || "[]"),
      createdBy: drawData.createdBy,
      createdAt: drawData.createdAt,
      completedAt: drawData.completedAt,
    };

    res.json(draw);
  } catch (error: any) {
    logger.error("draw", "Failed to get tournament draw", error);
    res.status(500).json({ error: error.message });
  }
});

