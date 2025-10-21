import { Router } from "express";
import db from "../../db.js";

export const usersRouter = Router();

// GET /api/users → רשימת משתמשים (מצומצם)
usersRouter.get("/", (_req, res) => {
  try {
    const rows = db
      .prepare("SELECT id, email, role, psnUsername, createdAt FROM users ORDER BY createdAt DESC")
      .all();
    res.json(rows);
  } catch (e: any) {
    console.error("Error fetching users:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// GET /api/users/:id → משתמש יחיד
usersRouter.get("/:id", (req, res) => {
  try {
    const id = req.params.id;
    const row = db
      .prepare("SELECT id, email, role, psnUsername, createdAt FROM users WHERE id=?")
      .get(id);
    if (!row) return res.status(404).json({ error: "user not found" });
    res.json(row);
  } catch (e: any) {
    console.error("Error fetching user:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});
