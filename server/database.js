
const Database = require("better-sqlite3");
const path = require("path");

// Database file
const dbPath = path.join(__dirname, "upnow.db");
const db = new Database(dbPath);

// Improve reliability
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Projects table — existing data is preserved
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    framework TEXT NOT NULL DEFAULT 'Other',
    status TEXT NOT NULL DEFAULT 'Ready',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// GitHub connections table
db.exec(`
  CREATE TABLE IF NOT EXISTS github_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    github_user_id INTEGER NOT NULL UNIQUE,
    github_username TEXT NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log("✅ Upnow database connected successfully");
console.log("✅ Projects and GitHub connections tables are ready");

module.exports = db;
