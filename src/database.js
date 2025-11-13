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
		log_channel_id VARCHAR(255),
		economy_money_per_message FLOAT DEFAULT 1,
		economy_xp_per_message INT DEFAULT 10
	  )
	`);

	await pool.execute(`
	  CREATE TABLE IF NOT EXISTS user_profiles (
		userId VARCHAR(255) NOT NULL,
		guildId VARCHAR(255) NOT NULL,
		money DECIMAL(15, 2) DEFAULT 0.00,
		xp INT DEFAULT 0,
		level INT DEFAULT 0,
		last_message_timestamp BIGINT DEFAULT 0,
		PRIMARY KEY (userId, guildId)
	  )
	`);

	await pool.execute(`
	  CREATE TABLE IF NOT EXISTS shop_items (
		id INT AUTO_INCREMENT PRIMARY KEY,
		guildId VARCHAR(255) NOT NULL,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		price DECIMAL(15, 2) NOT NULL,
		UNIQUE KEY (guildId, name)
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
	if (rows.length > 0) return rows[0];
	// Si pas de settings, en créer des par défaut
	await setGuildSettings(guildId, {});
	const [newRows] = await pool.execute('SELECT * FROM guild_settings WHERE guildId = ?', [guildId]);
	return newRows[0];
}

// --- Fonctions d'Économie ---

async function getUserProfile(userId, guildId) {
	const [rows] = await pool.execute('SELECT * FROM user_profiles WHERE userId = ? AND guildId = ?', [userId, guildId]);
	if (rows.length > 0) return rows[0];

	// Créer un profil s'il n'existe pas
	await pool.execute('INSERT INTO user_profiles (userId, guildId) VALUES (?, ?)', [userId, guildId]);
	const [newRows] = await pool.execute('SELECT * FROM user_profiles WHERE userId = ? AND guildId = ?', [userId, guildId]);
	return newRows[0];
}

async function updateUserProfile(userId, guildId, data) {
	const fields = Object.keys(data);
	const values = Object.values(data);
	const assignments = fields.map(field => `${field} = ?`).join(', ');

	const sql = `UPDATE user_profiles SET ${assignments} WHERE userId = ? AND guildId = ?`;
	await pool.execute(sql, [...values, userId, guildId]);
}

async function addShopItem(guildId, name, description, price) {
	await pool.execute(
		'INSERT INTO shop_items (guildId, name, description, price) VALUES (?, ?, ?, ?)',
		[guildId, name, description, price]
	);
}

async function removeShopItem(guildId, name) {
	const [result] = await pool.execute('DELETE FROM shop_items WHERE guildId = ? AND name = ?', [guildId, name]);
	return result.affectedRows;
}

async function getShopItem(guildId, name) {
	const [rows] = await pool.execute('SELECT * FROM shop_items WHERE guildId = ? AND name = ?', [guildId, name]);
	return rows[0];
}

async function getShopItems(guildId) {
	const [rows] = await pool.execute('SELECT * FROM shop_items WHERE guildId = ? ORDER BY price ASC', [guildId]);
	return rows;
}


// --- Fonctions de Sanctions ---

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
	// Économie
	getUserProfile,
	updateUserProfile,
	addShopItem,
	removeShopItem,
	getShopItem,
	getShopItems,
};
