import { Router } from "express";
import db from "../db.js";
export const disputes = Router();

disputes.get("/", (req,res)=>{
  const rows = db.prepare(`SELECT m.*, COUNT(s.id) as submissions FROM matches m JOIN submissions s ON s.matchId=m.id WHERE m.status='DISPUTED' GROUP BY m.id`).all();
  res.json(rows);
});

