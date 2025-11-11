const mysql = require('mysql2/promise');
const { db: dbConfig } = require('../config.json');

let pool;

async function init() {
	pool = mysql.createPool({
		host: process.env.DB_HOST || dbConfig.host,
		port: dbConfig.port,
		user: dbConfig.user,
		password: dbConfig.password,
		database: dbConfig.database,
		waitForConnections: true,
		connectionLimit: 10,
		queueLimit: 0
	});

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
		timestamp BIGINT NOT NULL,
		expires_at BIGINT, -- Pour les tempbans
		revoked BOOLEAN DEFAULT FALSE,
		revoked_by_id VARCHAR(255),
		revoked_by_name VARCHAR(255),
		revoked_reason VARCHAR(255),
		revoked_timestamp BIGINT
	  )
	`);

	await pool.execute(`
	  CREATE TABLE IF NOT EXISTS guild_settings (
		guildId VARCHAR(255) PRIMARY KEY,
		welcome_enabled BOOLEAN DEFAULT FALSE,
		welcome_channel_id VARCHAR(255),
		welcome_message TEXT,
		log_channel_id VARCHAR(255)
	  )
	`);

	console.log('MariaDB connection pool created and tables checked.');
}

async function setGuildSettings(guildId, newSettings) {
	const oldSettings = await getGuildSettings(guildId) || {};
	const settings = { ...oldSettings, ...newSettings };

	const sql = `
		INSERT INTO guild_settings (guildId, welcome_enabled, welcome_channel_id, welcome_message, log_channel_id)
		VALUES (?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			welcome_enabled = VALUES(welcome_enabled),
			welcome_channel_id = VALUES(welcome_channel_id),
			welcome_message = VALUES(welcome_message),
			log_channel_id = VALUES(log_channel_id)
	`;
	
	await pool.execute(sql, [
		guildId,
		settings.welcome_enabled || false,
		settings.welcome_channel_id || null,
		settings.welcome_message || null,
		settings.log_channel_id || null
	]);
}

async function getGuildSettings(guildId) {
	const [rows] = await pool.execute('SELECT * FROM guild_settings WHERE guildId = ?', [guildId]);
	return rows[0];
}

async function addSanction(guildId, userId, userName, moderatorId, moderatorName, type, reason, duration = null, expires_at = null) {
	const timestamp = Date.now();
	await pool.execute(
		'INSERT INTO sanctions (guildId, userId, userName, moderatorId, moderatorName, type, reason, duration, timestamp, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
		[guildId, userId, userName, moderatorId, moderatorName, type, reason, duration, timestamp, expires_at]
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

async function countSanctions(guildId, userId = null) {
	let sql = 'SELECT COUNT(id) as count FROM sanctions WHERE guildId = ?';
	const params = [guildId];
	if (userId) {
		sql += ' AND userId = ?';
		params.push(userId);
	}
	const [rows] = await pool.execute(sql, params);
	return rows[0].count;
}

async function getSanctionsPaginated(guildId, page, limit, userId = null) {
	const offset = (page - 1) * limit;
	let sql = 'SELECT * FROM sanctions WHERE guildId = ?';
	const params = [guildId];
	if (userId) {
		sql += ' AND userId = ?';
		params.push(userId);
	}
	sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
	params.push(limit, offset);

	const [rows] = await pool.execute(sql, params);
	return rows;
}

async function getExpiredBans() {
	const now = Date.now();
	const [rows] = await pool.execute(
		'SELECT * FROM sanctions WHERE type = ? AND revoked = FALSE AND expires_at IS NOT NULL AND expires_at <= ?',
		['BAN', now]
	);
	return rows;
}

async function getLatestActiveSanction(userId, guildId, type) {
	const [rows] = await pool.execute(
		'SELECT id FROM sanctions WHERE userId = ? AND guildId = ? AND type = ? AND revoked = FALSE ORDER BY timestamp DESC LIMIT 1',
		[userId, guildId, type]
	);
	return rows[0];
}

async function revokeSanction(sanctionId, guildId, revokerId, revokerName, reason) {
	const timestamp = Date.now();
	const [result] = await pool.execute(
		'UPDATE sanctions SET revoked = TRUE, revoked_by_id = ?, revoked_by_name = ?, revoked_reason = ?, revoked_timestamp = ? WHERE id = ? AND guildId = ?',
		[revokerId, revokerName, reason, timestamp, sanctionId, guildId]
	);
	return result.affectedRows;
}

module.exports = {
	init,
	setGuildSettings,
	getGuildSettings,
	addSanction,
	getUserHistory,
	getRecentHistory,
	countSanctions,
	getSanctionsPaginated,
	getExpiredBans,
	getLatestActiveSanction,
	revokeSanction,
};
