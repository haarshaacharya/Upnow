const Database = require("better-sqlite3");
const path = require("path");

// Database file will be created inside the server folder
const dbPath = path.join(__dirname, "upnow.db");
const db = new Database(dbPath);

// Improve reliability
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create projects table
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    framework TEXT NOT NULL DEFAULT 'Other',
    status TEXT NOT NULL DEFAULT 'Ready',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log("✅ Upnow database connected successfully");

module.exports = db;