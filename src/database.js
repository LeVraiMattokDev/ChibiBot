const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve(__dirname, '..', 'mod_history.sqlite'), { fileMustExist: false });

db.exec(`
  CREATE TABLE IF NOT EXISTS sanctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    userName TEXT NOT NULL,
    moderatorId TEXT NOT NULL,
    moderatorName TEXT NOT NULL,
    type TEXT NOT NULL,
    reason TEXT,
    duration INTEGER,
    timestamp INTEGER NOT NULL
  )
`);

console.log('Database initialized for guild-specific storage.');

function addSanction(guildId, userId, userName, moderatorId, moderatorName, type, reason, duration = null) {
  const stmt = db.prepare(`
    INSERT INTO sanctions (guildId, userId, userName, moderatorId, moderatorName, type, reason, duration, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(guildId, userId, userName, moderatorId, moderatorName, type, reason, duration, Date.now());
}

function getUserHistory(userId, guildId) {
  const stmt = db.prepare('SELECT * FROM sanctions WHERE userId = ? AND guildId = ? ORDER BY timestamp DESC');
  return stmt.all(userId, guildId);
}

function getRecentHistory(guildId, limit = 10) {
  const stmt = db.prepare('SELECT * FROM sanctions WHERE guildId = ? ORDER BY timestamp DESC LIMIT ?');
  return stmt.all(guildId, limit);
}

module.exports = {
  addSanction,
  getUserHistory,
  getRecentHistory,
};
