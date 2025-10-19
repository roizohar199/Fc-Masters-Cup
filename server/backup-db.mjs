/**
 * Database Backup Script
 * Creates automatic backups of the tournament database
 * Usage: node server/backup-db.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const dbPath = path.join(__dirname, 'tournaments.sqlite');
const backupDir = path.join(__dirname, '..', 'backups');
const maxBackupAgeDays = 30; // Keep backups for 30 days

// Create backup directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`📁 Created backup directory: ${backupDir}`);
}

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.error(`❌ Database not found at: ${dbPath}`);
  process.exit(1);
}

// Create backup with timestamp
const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const backupFileName = `backup-${timestamp}.sqlite`;
const backupPath = path.join(backupDir, backupFileName);

try {
  // Copy database file
  fs.copyFileSync(dbPath, backupPath);
  
  // Get file size for logging
  const stats = fs.statSync(backupPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`✅ Backup created successfully!`);
  console.log(`   File: ${backupFileName}`);
  console.log(`   Size: ${fileSizeMB} MB`);
  console.log(`   Path: ${backupPath}`);
  
  // Clean up old backups
  cleanOldBackups();
  
} catch (error) {
  console.error(`❌ Backup failed:`, error.message);
  process.exit(1);
}

/**
 * Remove backups older than maxBackupAgeDays
 */
function cleanOldBackups() {
  const files = fs.readdirSync(backupDir);
  const cutoffDate = Date.now() - (maxBackupAgeDays * 24 * 60 * 60 * 1000);
  let deletedCount = 0;
  
  files.forEach(file => {
    if (!file.startsWith('backup-') || !file.endsWith('.sqlite')) {
      return; // Skip non-backup files
    }
    
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtimeMs < cutoffDate) {
      try {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`🗑️  Deleted old backup: ${file}`);
      } catch (error) {
        console.error(`⚠️  Failed to delete ${file}:`, error.message);
      }
    }
  });
  
  if (deletedCount === 0) {
    console.log(`📊 No old backups to delete (keeping ${maxBackupAgeDays} days)`);
  } else {
    console.log(`📊 Deleted ${deletedCount} old backup(s)`);
  }
  
  // Show total backups remaining
  const remainingBackups = fs.readdirSync(backupDir).filter(f => 
    f.startsWith('backup-') && f.endsWith('.sqlite')
  ).length;
  console.log(`📦 Total backups: ${remainingBackups}`);
}

