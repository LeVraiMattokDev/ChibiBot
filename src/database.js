const mysql = require('mysql2/promise');
const { db: dbConfig } = require('../config.json');

let pool;

async function init() {
	pool = mysql.createPool({
		host: dbConfig.host,
		port: dbConfig.port,
		user: dbConfig.user,
		password: dbConfig.password,
		database: dbConfig.database,
		waitForConnections: true,
		connectionLimit: 10,
		queueLimit: 0
	});

	// La table est légèrement modifiée pour être compatible MySQL
	await pool.execute(`
	  CREATE TABLE IF NOT EXISTS sanctions (
		id INT AUTO_INCREMENT PRIMARY KEY,
		guildId VARCHAR(255) NOT NULL,
		userId VARCHAR(255) NOT NULL,
		userName VARCHAR(255) NOT NULL,
		moderatorId VARCHAR(255) NOT NULL,
		moderatorName VARCHAR(255) NOT NULL,
		type VARCHAR(255) NOT NULL,
		reason TEXT,
		duration INT,
		timestamp BIGINT NOT NULL
	  )
	`);

	console.log('MariaDB connection pool created and table checked.');
}

async function addSanction(guildId, userId, userName, moderatorId, moderatorName, type, reason, duration = null) {
	const timestamp = Date.now();
	await pool.execute(
		'INSERT INTO sanctions (guildId, userId, userName, moderatorId, moderatorName, type, reason, duration, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
		[guildId, userId, userName, moderatorId, moderatorName, type, reason, duration, timestamp]
	);
}

async function getUserHistory(userId, guildId) {
	const [rows] = await pool.execute(
		'SELECT * FROM sanctions WHERE userId = ? AND guildId = ? ORDER BY timestamp DESC',
		[userId, guildId]
	);
	return rows;
}

async function getRecentHistory(guildId, limit = 10) {
	const [rows] = await pool.execute(
		'SELECT * FROM sanctions WHERE guildId = ? ORDER BY timestamp DESC LIMIT ?',
		[guildId, limit]
	);
	return rows;
}

module.exports = {
	init,
	addSanction,
	getUserHistory,
	getRecentHistory,
};
