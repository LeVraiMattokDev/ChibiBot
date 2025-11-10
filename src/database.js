const Database = require('better-sqlite3');
const path = require('path');

// Crée ou ouvre la base de données dans le dossier principal du projet
const db = new Database(path.resolve(__dirname, '..', 'mod_history.sqlite'), { fileMustExist: false });

// Crée la table si elle n'existe pas déjà
db.exec(`
  CREATE TABLE IF NOT EXISTS sanctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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

console.log('Database initialized.');

// Fonctions pour interagir avec la DB
function addSanction(userId, userName, moderatorId, moderatorName, type, reason, duration = null) {
  const stmt = db.prepare(`
    INSERT INTO sanctions (userId, userName, moderatorId, moderatorName, type, reason, duration, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(userId, userName, moderatorId, moderatorName, type, reason, duration, Date.now());
}

function getUserHistory(userId) {
  const stmt = db.prepare('SELECT * FROM sanctions WHERE userId = ? ORDER BY timestamp DESC');
  return stmt.all(userId);
}

function getRecentHistory(limit = 10) {
  const stmt = db.prepare('SELECT * FROM sanctions ORDER BY timestamp DESC LIMIT ?');
  return stmt.all(limit);
}

module.exports = {
  addSanction,
  getUserHistory,
  getRecentHistory,
};
