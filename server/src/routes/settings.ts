import { Router } from "express";
import db from "../db.js";
import { z } from "zod";

export const settings = Router();

// Get all settings
settings.get("/", (req, res) => {
  try {
    const allSettings = db.prepare("SELECT * FROM settings ORDER BY key").all();
    res.json({ ok: true, settings: allSettings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch settings" });
  }
});

// Get specific setting by key
settings.get("/:key", (req, res) => {
  try {
    const { key } = req.params;
    const setting = db.prepare("SELECT * FROM settings WHERE key = ?").get(key);
    
    if (!setting) {
      return res.status(404).json({ ok: false, error: "Setting not found" });
    }
    
    res.json({ ok: true, setting });
  } catch (error) {
    console.error("Error fetching setting:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch setting" });
  }
});

// Update or create setting
settings.post("/", (req: any, res) => {
  try {
    const { key, value, description } = req.body;
    const updatedBy = req.user?.email || "system";
    
    if (!key) {
      return res.status(400).json({ ok: false, error: "Key is required" });
    }
    
    const now = new Date().toISOString();
    
    // Check if setting exists
    const existing = db.prepare("SELECT id FROM settings WHERE key = ?").get(key);
    
    if (existing) {
      // Update existing setting
      db.prepare(`
        UPDATE settings 
        SET value = ?, description = ?, updatedAt = ?, updatedBy = ?
        WHERE key = ?
      `).run(value, description, now, updatedBy, key);
    } else {
      // Create new setting
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO settings (id, key, value, description, updatedAt, updatedBy)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, key, value, description, now, updatedBy);
    }
    
    res.json({ ok: true, message: "Setting updated successfully" });
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({ ok: false, error: "Failed to update setting" });
  }
});

// Delete setting
settings.delete("/:key", (req, res) => {
  try {
    const { key } = req.params;
    
    const result = db.prepare("DELETE FROM settings WHERE key = ?").run(key);
    
    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: "Setting not found" });
    }
    
    res.json({ ok: true, message: "Setting deleted successfully" });
  } catch (error) {
    console.error("Error deleting setting:", error);
    res.status(500).json({ ok: false, error: "Failed to delete setting" });
  }
});
