import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { SubmitResultDTO } from "../models.js";
import db from "../db.js";
import { uuid } from "../utils/ids.js";
import { nowISO } from "../lib/util.js";
import { applySubmission } from "../lib/consensus.js";
import type { ProofUploadBody, MatchOverrideBody } from "../types/dtos.js";

export const matches = Router();

// Secure file upload configuration
const upload = multer({ 
  dest: path.join(process.cwd(), "server/src/uploads"),
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1 // Only 1 file per upload
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();
    
    if (allowedMimeTypes.includes(mimeType) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('רק קבצי תמונה מותרים (JPG, PNG, WEBP)!'));
    }
  }
});

// Get match public info (for link)
matches.get("/:id", (req,res)=>{
  const row = db.prepare(`SELECT id,round,homeId,awayId,token,pin,status,homeScore,awayScore FROM matches WHERE id=?`).get(req.params.id);
  if (!row) return res.status(404).json({error: "not found"});
  res.json(row);
});

// Player submit (with token) - Legacy endpoint
matches.post("/:id/submit", upload.single("evidence"), (req,res)=>{
  const match = db.prepare(`SELECT token FROM matches WHERE id=?`).get(req.params.id) as any;
  if (!match) return res.status(404).json({error: "not found"});
  if (req.headers["x-match-token"] !== match.token) return res.status(403).json({error: "bad token"});

  const bodyRaw = { ...req.body, scoreHome: Number(req.body.scoreHome), scoreAway: Number(req.body.scoreAway) };
  const parsed = SubmitResultDTO.safeParse(bodyRaw);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const filePath = req.file ? req.file.path : undefined;
  const sId = uuid();
  db.prepare(`INSERT INTO submissions (id,matchId,reporterPsn,scoreHome,scoreAway,pin,evidencePath,createdAt) VALUES (?,?,?,?,?,?,?,?)`)
    .run(sId, req.params.id, parsed.data.reporterPsn, parsed.data.scoreHome, parsed.data.scoreAway, parsed.data.pin, filePath, nowISO());

  const result = applySubmission(req.params.id);
  res.json(result);
});

// Player submit (authenticated) - New improved endpoint
matches.post("/:id/submit-authenticated", upload.single("evidence"), (req,res)=>{
  try {
    // וידוא שהמשחק קיים
    const match = db.prepare(`SELECT id, homeId, awayId, homePsn, awayPsn, status FROM matches WHERE id=?`).get(req.params.id) as any;
    if (!match) return res.status(404).json({error: "Match not found"});
    
    // אין צורך באימות משתמש - כל אחד יכול להגיש תוצאה עם PIN
    // הבדיקה היא דרך ה-PIN ושם המשתמש PSN
    
    const bodyRaw = { 
      ...req.body, 
      scoreHome: Number(req.body.scoreHome), 
      scoreAway: Number(req.body.scoreAway) 
    };
    const parsed = SubmitResultDTO.safeParse(bodyRaw);
    if (!parsed.success) {
      return res.status(400).json({error: "Invalid data", details: parsed.error});
    }

    // שמירת התמונה
    const filePath = req.file ? req.file.path : undefined;
    if (!filePath) {
      return res.status(400).json({error: "Image evidence is required"});
    }

    // ניתוח התמונה (אם הועבר)
    let imageAnalysis = null;
    if (req.body.imageAnalysis) {
      try {
        imageAnalysis = JSON.parse(req.body.imageAnalysis);
      } catch {
        imageAnalysis = null;
      }
    }

    // בדיקה אם יש עריכה בתמונה - אזהרה בלוגים
    if (imageAnalysis && imageAnalysis.editSigns && imageAnalysis.editSigns.length > 0) {
      console.warn(`⚠️ EDITED IMAGE DETECTED for match ${req.params.id}`);
      console.warn(`Reporter: ${parsed.data.reporterPsn}`);
      console.warn(`Edit signs: ${imageAnalysis.editSigns.join(', ')}`);
    }

    // שמירת ההגשה
    const sId = uuid();
    const submissionData = {
      id: sId,
      matchId: req.params.id,
      reporterPsn: parsed.data.reporterPsn,
      scoreHome: parsed.data.scoreHome,
      scoreAway: parsed.data.scoreAway,
      pin: parsed.data.pin,
      evidencePath: filePath,
      imageAnalysis: imageAnalysis ? JSON.stringify(imageAnalysis) : null,
      createdAt: nowISO()
    };

    // בדיקה אם הטבלה submissions כוללת עמודת imageAnalysis
    try {
      db.prepare(`INSERT INTO submissions (id,matchId,reporterPsn,scoreHome,scoreAway,pin,evidencePath,imageAnalysis,createdAt) VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(sId, submissionData.matchId, submissionData.reporterPsn, submissionData.scoreHome, submissionData.scoreAway, submissionData.pin, submissionData.evidencePath, submissionData.imageAnalysis, submissionData.createdAt);
    } catch (err: any) {
      // אם העמודה לא קיימת, ננסה בלי imageAnalysis
      if (err.message && err.message.includes('no column named imageAnalysis')) {
        db.prepare(`INSERT INTO submissions (id,matchId,reporterPsn,scoreHome,scoreAway,pin,evidencePath,createdAt) VALUES (?,?,?,?,?,?,?,?)`)
          .run(sId, submissionData.matchId, submissionData.reporterPsn, submissionData.scoreHome, submissionData.scoreAway, submissionData.pin, submissionData.evidencePath, submissionData.createdAt);
      } else {
        throw err;
      }
    }

    const result = applySubmission(req.params.id);
    
    // הוספת מידע על זיהוי עריכה לתגובה
    if (imageAnalysis && imageAnalysis.editSigns && imageAnalysis.editSigns.length > 0) {
      result.warning = "זוהו סימני עריכה בתמונה - המנהל יבדוק את ההגשה";
    }
    
    res.json(result);
  } catch (err: any) {
    console.error("Error in submit-authenticated:", err);
    res.status(500).json({error: "Internal server error", details: err.message});
  }
});

// Get submissions for a match (admin)
matches.get("/:id/submissions", (req,res)=>{
  const rows = db.prepare(`SELECT * FROM submissions WHERE matchId=? ORDER BY createdAt ASC`).all(req.params.id);
  res.json(rows);
});

// Upload proof image for a match
matches.post("/proof", upload.single("proof"), (req,res)=>{
  try {
    const { matchId, playerRole } = req.body as ProofUploadBody;
    
    if (!matchId || !playerRole) {
      return res.status(400).json({error: "Missing matchId or playerRole"});
    }
    
    if (!req.file) {
      return res.status(400).json({error: "No image file uploaded"});
    }
    
    // בדיקה שהמשחק קיים
    const match = db.prepare(`SELECT id, homeId, awayId FROM matches WHERE id=?`).get(matchId);
    if (!match) {
      return res.status(404).json({error: "Match not found"});
    }
    
    // עדכון הנתיב של התמונה בהתאם לתפקיד השחקן
    const filePath = req.file.path;
    const evidenceField = playerRole === 'home' ? 'evidenceHome' : 'evidenceAway';
    
    db.prepare(`UPDATE matches SET ${evidenceField}=? WHERE id=?`)
      .run(filePath, matchId);
    
    res.json({ 
      success: true, 
      message: "Proof image uploaded successfully",
      filePath: filePath
    });
    
  } catch (error) {
    console.error("Error uploading proof:", error);
    res.status(500).json({error: "Failed to upload proof image"});
  }
});

// Get proof images for a match (admin only)
matches.get("/:id/proofs", (req,res)=>{
  try {
    const match = db.prepare(`SELECT id, evidenceHome, evidenceAway FROM matches WHERE id=?`).get(req.params.id) as { id: string; evidenceHome: string | null; evidenceAway: string | null } | undefined;
    if (!match) {
      return res.status(404).json({error: "Match not found"});
    }
    
    res.json({
      matchId: match.id,
      evidenceHome: match.evidenceHome,
      evidenceAway: match.evidenceAway
    });
    
  } catch (error) {
    console.error("Error getting proofs:", error);
    res.status(500).json({error: "Failed to get proof images"});
  }
});

// Admin override
matches.post("/:id/override", (req,res)=>{
  const { homeScore, awayScore } = req.body as MatchOverrideBody;
  if (typeof homeScore!=="number" || typeof awayScore!=="number") return res.status(400).json({error:"need scores"});
  db.prepare(`UPDATE matches SET homeScore=?, awayScore=?, status='CONFIRMED' WHERE id=?`).run(homeScore, awayScore, req.params.id);
  res.json({ status: "CONFIRMED" });
});

