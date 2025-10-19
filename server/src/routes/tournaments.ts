import { Router } from "express";
import { CreateTournamentDTO, SeedPlayersDTO } from "../models.js";
import db from "../db.js";
import { uuid } from "../db.js";
import { nowISO } from "../lib/util.js";
import { generateRoundOf16, advanceWinners } from "../lib/bracket.js";

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

// Bracket
tournaments.get("/:id/bracket", (req,res)=>{
  const rows = db.prepare(`SELECT * FROM matches WHERE tournamentId=? ORDER BY createdAt ASC`).all(req.params.id);
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

