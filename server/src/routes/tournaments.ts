import { Router } from "express";
import { CreateTournamentDTO, SeedPlayersDTO } from "../models.js";
import db from "../db.js";
import { uuid, genToken, genPin } from "../utils/ids.js";
import { nowISO } from "../lib/util.js";
import { generateRoundOf16, advanceWinners } from "../lib/bracket.js";
import type { AdvancePreviewBody, AdvanceConfirmBody, AdvanceRevertBody } from "../types/dtos.js";

export const tournaments = Router();

// Helper function to check if user is super admin
function isSuperAdmin(email: string): boolean {
  const user = db.prepare(`SELECT isSuperAdmin FROM users WHERE email=?`).get(email) as any;
  return user && user.isSuperAdmin === 1;
}

// Create tournament
tournaments.post("/", (req, res)=>{
  console.log("🏆 יצירת טורניר חדש - נתונים שהתקבלו:", req.body);
  
  const parsed = CreateTournamentDTO.safeParse(req.body);
  if (!parsed.success) {
    console.log("❌ שגיאת validation:", parsed.error);
    return res.status(400).json(parsed.error);
  }
  
  const t = parsed.data;
  const id = uuid();
  
  console.log("✅ נתונים תקינים, יוצר טורניר עם ID:", id);
  console.log("📊 פרטי הטורניר:", {
    title: t.title,
    game: t.game,
    prizeFirst: t.prizeFirst,
    prizeSecond: t.prizeSecond,
    nextTournamentDate: t.nextTournamentDate,
    telegramLink: t.telegramLink
  });
  
  try {
    db.prepare(`INSERT INTO tournaments (id,title,game,platform,timezone,createdAt,prizeFirst,prizeSecond,nextTournamentDate,telegramLink) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(id, t.title, t.game, "PS5", process.env.TZ || "Asia/Jerusalem", nowISO(), t.prizeFirst, t.prizeSecond, t.nextTournamentDate || null, t.telegramLink || null);
    
    console.log("✅ טורניר נשמר בהצלחה במסד הנתונים!");
    res.json({ id });
  } catch (error) {
    console.error("❌ שגיאה בשמירת הטורניר:", error);
    res.status(500).json({ error: "שגיאה בשמירת הטורניר" });
  }
});

// Seed 16 players and generate R16
tournaments.post("/seed", (req,res)=>{
  const parsed = SeedPlayersDTO.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const { tournamentId, players } = parsed.data;
  
  // קודם כל, נעדכן את כל השחקנים הקיימים ל-DISABLED
  db.prepare(`UPDATE players SET status='DISABLED'`).run();
  
  // עכשיו נוסיף/נעדכן את השחקנים שנבחרו ל-ACTIVE
  const upsert = db.prepare(`INSERT INTO players (id,psn,displayName,status) VALUES (?,?,?,?) 
    ON CONFLICT(id) DO UPDATE SET status='ACTIVE', psn=excluded.psn, displayName=excluded.displayName`);
  for (const p of players) upsert.run(p.id, p.psn, p.displayName, 'ACTIVE');
  
  const ids = generateRoundOf16(tournamentId, players.map(p=>p.id));
  res.json({ matchIds: ids });
});

// Advance winners to next round
tournaments.post("/:id/advance/:round", (req,res)=>{
  const tournamentId = req.params.id;
  const round = req.params.round as any;
  
  // קבל את המשחקים בסיבוב הנוכחי
  const matches = db.prepare(`SELECT homeId, awayId, homeScore, awayScore FROM matches WHERE tournamentId=? AND round=?`)
    .all(tournamentId, round) as any[];
  
  // זהה את המפסידים ועדכן אותם ל-DISABLED
  const loserIds = new Set<string>();
  for (const match of matches) {
    if (match.homeScore !== null && match.awayScore !== null) {
      if (match.homeScore < match.awayScore) {
        loserIds.add(match.homeId);
      } else if (match.awayScore < match.homeScore) {
        loserIds.add(match.awayId);
      }
    }
  }
  
  // עדכן את המפסידים ל-DISABLED
  const disableStmt = db.prepare(`UPDATE players SET status='DISABLED' WHERE id=?`);
  for (const loserId of loserIds) {
    disableStmt.run(loserId);
  }
  
  const ids = advanceWinners(tournamentId, round);
  res.json({ nextMatchIds: ids, disabledPlayers: Array.from(loserIds) });
});

// Preview advance winners (dry-run)
tournaments.post("/:id/advance/preview", (req, res) => {
  const tournamentId = req.params.id;
  const { round, winners, seeds } = req.body as AdvancePreviewBody;
  
  if (!round || !winners || !Array.isArray(winners)) {
    return res.status(400).json({ error: "Missing required fields: round, winners" });
  }
  
  if (winners.length % 2 !== 0) {
    return res.status(400).json({ error: "Number of winners must be even" });
  }
  
  try {
    // Generate preview matches without saving to database
    const nextRound = getNextRound(round);
    if (!nextRound) {
      return res.status(400).json({ error: "Invalid round or no next round available" });
    }
    
    // Create preview matches based on seeds
    const previewMatches = [];
    for (let i = 0; i < winners.length; i += 2) {
      const homePlayer = winners[i];
      const awayPlayer = winners[i + 1];
      
      previewMatches.push({
        id: `preview-${i/2 + 1}`,
        homeId: homePlayer,
        awayId: awayPlayer,
        round: nextRound,
        homeSeed: seeds ? seeds.find((s: any) => s.id === homePlayer)?.seed : i + 1,
        awaySeed: seeds ? seeds.find((s: any) => s.id === awayPlayer)?.seed : i + 2
      });
    }
    
    res.json({ 
      success: true,
      nextRound,
      matches: previewMatches,
      winnerCount: winners.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm advance winners with idempotency
tournaments.post("/:id/advance/confirm", (req, res) => {
  const tournamentId = req.params.id;
  const { round, winners, seeds, idempotencyKey } = req.body as AdvanceConfirmBody;
  
  if (!round || !winners || !Array.isArray(winners) || !idempotencyKey) {
    return res.status(400).json({ error: "Missing required fields: round, winners, idempotencyKey" });
  }
  
  if (winners.length % 2 !== 0) {
    return res.status(400).json({ error: "Number of winners must be even" });
  }
  
  // Check if this operation was already performed (idempotency)
  const existingOperation = db.prepare(`
    SELECT id FROM advance_operations 
    WHERE tournamentId=? AND round=? AND idempotencyKey=?
  `).get(tournamentId, round, idempotencyKey) as { id: string } | undefined;
  
  if (existingOperation) {
    return res.json({ 
      success: true, 
      message: "Operation already performed",
      idempotencyKey 
    });
  }
  
  try {
    // Start transaction
    db.exec("BEGIN TRANSACTION");
    
    // Record the operation
    const operationId = uuid();
    db.prepare(`
      INSERT INTO advance_operations (id, tournamentId, round, winners, seeds, idempotencyKey, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      operationId, 
      tournamentId, 
      round, 
      JSON.stringify(winners),
      JSON.stringify(seeds || []),
      idempotencyKey,
      nowISO()
    );
    
    // Generate actual matches
    const matchIds = generateNextRoundMatches(tournamentId, round, winners, seeds || []);
    
    db.exec("COMMIT");
    
    res.json({ 
      success: true,
      matchIds,
      operationId,
      idempotencyKey
    });
  } catch (error: any) {
    db.exec("ROLLBACK");
    res.status(500).json({ error: error.message });
  }
});

// Revert advance operation
tournaments.post("/:id/advance/revert", (req, res) => {
  const tournamentId = req.params.id;
  const { idempotencyKey } = req.body as AdvanceRevertBody;
  
  if (!idempotencyKey) {
    return res.status(400).json({ error: "Missing idempotencyKey" });
  }
  
  try {
    // Find the operation
    const operation = db.prepare(`
      SELECT * FROM advance_operations 
      WHERE tournamentId=? AND idempotencyKey=?
    `).get(tournamentId, idempotencyKey) as { id: string; round: string; createdAt: string } | undefined;
    
    if (!operation) {
      return res.status(404).json({ error: "Operation not found" });
    }
    
    // Check if it's within 30 seconds
    const operationTime = new Date(operation.createdAt).getTime();
    const now = Date.now();
    const timeDiff = now - operationTime;
    
    if (timeDiff > 30000) { // 30 seconds
      return res.status(400).json({ error: "Revert window expired (30 seconds)" });
    }
    
    // Start transaction
    db.exec("BEGIN TRANSACTION");
    
    // Delete generated matches for the next round
    const nextRound = getNextRound(operation.round);
    if (nextRound) {
      db.prepare(`
        DELETE FROM matches 
        WHERE tournamentId=? AND round=? AND createdAt > ?
      `).run(tournamentId, nextRound, operation.createdAt);
    }
    
    // Mark operation as reverted
    db.prepare(`
      UPDATE advance_operations 
      SET revertedAt=?, reverted=true 
      WHERE id=?
    `).run(nowISO(), operation.id);
    
    db.exec("COMMIT");
    
    res.json({ 
      success: true,
      message: "Operation reverted successfully"
    });
  } catch (error: any) {
    db.exec("ROLLBACK");
    res.status(500).json({ error: error.message });
  }
});

// Bracket
tournaments.get("/:id/bracket", (req,res)=>{
  const rows = db.prepare(`SELECT * FROM matches WHERE tournamentId=? ORDER BY createdAt ASC`).all(req.params.id);
  res.json(rows);
});

// Get matches for a specific tournament and round
tournaments.get("/:id/matches", (req,res)=>{
  const tournamentId = req.params.id;
  const round = req.query.round as string;
  
  let query = `SELECT * FROM matches WHERE tournamentId=?`;
  let params = [tournamentId];
  
  if (round) {
    query += ` AND round=?`;
    params.push(round);
  }
  
  query += ` ORDER BY createdAt ASC`;
  
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// Get all players in a tournament (optimized - fixed N+1 query)
tournaments.get("/:id/players", (req,res)=>{
  // Single optimized query instead of N+1 queries
  const players = db.prepare(`
    SELECT DISTINCT p.* 
    FROM players p
    JOIN matches m ON (p.id = m.homeId OR p.id = m.awayId)
    WHERE m.tournamentId = ?
  `).all(req.params.id);
  res.json(players);
});

// Get all tournaments
tournaments.get("/", (req,res)=>{
  const rows = db.prepare(`SELECT * FROM tournaments ORDER BY createdAt DESC`).all();
  res.json(rows);
});

// Get single tournament by ID
tournaments.get("/:id", (req, res) => {
  try {
    const tournament = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    res.json(tournament);
  } catch (error) {
    console.error("Error fetching tournament:", error);
    res.status(500).json({ error: "Failed to fetch tournament" });
  }
});

// Update tournament
tournaments.put("/:id", (req, res) => {
  const { id } = req.params;
  const { title, game, prizeFirst, prizeSecond, nextTournamentDate, telegramLink } = req.body;
  
  try {
    db.prepare(`
      UPDATE tournaments 
      SET title=?, game=?, prizeFirst=?, prizeSecond=?, nextTournamentDate=?, telegramLink=?
      WHERE id=?
    `).run(title, game, prizeFirst, prizeSecond, nextTournamentDate || null, telegramLink || null, id);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating tournament:", error);
    res.status(500).json({ error: "שגיאה בעדכון הטורניר" });
  }
});

// Delete tournament (super admin only)
tournaments.delete("/:id", (req, res) => {
  const { id } = req.params;
  const userEmail = (req as any).user?.email;
  
  // בדיקת הרשאת Super Admin
  if (!userEmail || !isSuperAdmin(userEmail)) {
    return res.status(403).json({ error: "מחיקת טורניר דורשת הרשאת מנהל על" });
  }
  
  try {
    // בדיקה אם הטורניר קיים
    const tournament = db.prepare("SELECT id, title FROM tournaments WHERE id=?").get(id) as any;
    
    if (!tournament) {
      return res.status(404).json({ error: "טורניר לא נמצא" });
    }
    
    // מחיקת כל המשחקים של הטורניר
    db.prepare("DELETE FROM matches WHERE tournamentId=?").run(id);
    
    // מחיקת כל ההגשות של משחקי הטורניר
    const matchIds = db.prepare("SELECT id FROM matches WHERE tournamentId=?").all(id) as any[];
    matchIds.forEach((match) => {
      db.prepare("DELETE FROM submissions WHERE matchId=?").run(match.id);
    });
    
    // מחיקת השחקנים של הטורניר (אם יש טבלה כזו)
    // db.prepare("DELETE FROM tournament_players WHERE tournamentId=?").run(id);
    
    // מחיקת הטורניר עצמו
    db.prepare("DELETE FROM tournaments WHERE id=?").run(id);
    
    console.log(`✅ טורניר נמחק בהצלחה: ${tournament.title} (ID: ${id}) על ידי מנהל על: ${userEmail}`);
    res.json({ success: true, message: "הטורניר נמחק בהצלחה" });
  } catch (error) {
    console.error("Error deleting tournament:", error);
    res.status(500).json({ error: "שגיאה במחיקת הטורניר" });
  }
});

// Helper functions
function getNextRound(round: string): string | null {
  const order = ["R16", "QF", "SF", "F"];
  const index = order.indexOf(round);
  return index < order.length - 1 ? order[index + 1] : null;
}

function generateNextRoundMatches(tournamentId: string, currentRound: string, winners: string[], seeds: any[]) {
  const nextRound = getNextRound(currentRound);
  if (!nextRound) throw new Error("No next round available");
  
  const matchIds: string[] = [];
  const insert = db.prepare(`
    INSERT INTO matches (id, tournamentId, round, homeId, awayId, homeScore, awayScore, status, token, pin, evidenceHome, evidenceAway, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (let i = 0; i < winners.length; i += 2) {
    const homeId = winners[i];
    const awayId = winners[i + 1];
    const matchId = uuid();
    
    insert.run(
      matchId, tournamentId, nextRound, homeId, awayId, 
      null, null, "PENDING", genToken(), genPin(), null, null, nowISO()
    );
    
    matchIds.push(matchId);
  }
  
  return matchIds;
}

// Tournament participant selection (admin only)
// Merged from modules/tournaments/routes.ts to avoid duplicate router registration
tournaments.post("/:id/select", async (req: any, res) => {
  // Check admin permissions
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "super_admin")) {
    return res.status(403).json({ error: "forbidden - admin access required" });
  }
  
  const tournamentId = req.params.id;
  const userIds: string[] = req.body.userIds || [];
  
  if (!userIds.length) {
    return res.status(400).json({ error: "userIds required" });
  }
  
  try {
    // Import selection functions dynamically to avoid circular dependencies
    const { selectParticipants, flushEmailQueue } = await import("../modules/tournaments/selection.js");
    
    selectParticipants(tournamentId, userIds);
    await flushEmailQueue();
    
    res.json({ ok: true, message: `Selected ${userIds.length} participants for tournament` });
  } catch (error: any) {
    console.error("Error selecting participants:", error);
    res.status(500).json({ error: error.message || "Failed to select participants" });
  }
});

