import { Router } from "express";
import { CreateTournamentDTO } from "../models.js";
import db from "../db.js";
import { uuid, genToken, genPin } from "../utils/ids.js";
import { nowISO } from "../lib/util.js";
// Removed bracket-generation utilities and DTOs
import { deleteNotificationsByTournamentId } from "../modules/notifications/model.js";
import { selectPlayersManually } from "../services/selectionService.js";

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

// Removed bracket-related endpoints

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
tournaments.delete("/:id", async (req, res) => {
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
    
    // מחיקת הודעות קשורות לטורניר
    const deletedNotifications = deleteNotificationsByTournamentId(id);
    console.log(`🗑️ נמחקו ${deletedNotifications.changes} הודעות קשורות לטורניר ${id}`);
    
    // הודעת לוג על מחיקת הודעות
    console.log(`📡 הודעות קשורות לטורניר ${id} נמחקו - המשתמשים יראו עדכון ברענון הבא`);
    
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

// Helper functions removed (bracket system deprecated)

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
    
    await selectParticipants(tournamentId, userIds);
    await flushEmailQueue();
    
    res.json({ ok: true, message: `Selected ${userIds.length} participants for tournament` });
  } catch (error: any) {
    console.error("Error selecting participants:", error);
    res.status(500).json({ error: error.message || "Failed to select participants" });
  }
});

// בחירה ידנית של שחקנים על ידי המנהל
tournaments.post("/:id/select-players-manually", async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const { stage, playerIds, sendEmails = true, createHomepageNotice = true } = req.body;
    
    if (!stage || !playerIds || !Array.isArray(playerIds)) {
      return res.status(400).json({ error: "Missing required fields: stage, playerIds" });
    }
    
    if (playerIds.length === 0) {
      return res.status(400).json({ error: "Must select at least one player" });
    }
    
    // tournamentId is already a string (UUID)
    const result = await selectPlayersManually({
      tournamentId: tournamentId,
      stage,
      selectedPlayerIds: playerIds,
      sendEmails,
      createHomepageNotice
    });
    
    res.json({ 
      ok: true, 
      message: `נבחרו ${result.total} שחקנים לשלב ${result.stage}`,
      selected: result.selected
    });
  } catch (error: any) {
    console.error("Error in manual player selection:", error);
    res.status(500).json({ error: error.message || "Failed to select players manually" });
  }
});

