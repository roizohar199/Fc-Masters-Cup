import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { SubmitResultDTO } from "../models.js";
import db from "../db.js";
import { uuid } from "../db.js";
import { nowISO } from "../lib/util.js";
import { applySubmission } from "../lib/consensus.js";

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

// Player submit (with token)
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

// Get submissions for a match (admin)
matches.get("/:id/submissions", (req,res)=>{
  const rows = db.prepare(`SELECT * FROM submissions WHERE matchId=? ORDER BY createdAt ASC`).all(req.params.id);
  res.json(rows);
});

// Admin override
matches.post("/:id/override", (req,res)=>{
  const { homeScore, awayScore } = req.body || {};
  if (typeof homeScore!=="number" || typeof awayScore!=="number") return res.status(400).json({error:"need scores"});
  db.prepare(`UPDATE matches SET homeScore=?, awayScore=?, status='CONFIRMED' WHERE id=?`).run(homeScore, awayScore, req.params.id);
  res.json({ status: "CONFIRMED" });
});

