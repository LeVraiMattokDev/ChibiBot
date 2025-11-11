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
		timestamp BIGINT NOT NULL,
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
	
	await pool.execute(`
	  CREATE TABLE IF NOT EXISTS ticket_configs (
		id INT AUTO_INCREMENT PRIMARY KEY,
		guildId VARCHAR(255) NOT NULL,
		panel_name VARCHAR(255) NOT NULL, -- Nom interne pour la config
		message_id VARCHAR(255), -- ID du message contenant le panneau
		channel_id VARCHAR(255), -- ID du salon où se trouve le panneau
		category_id VARCHAR(255) NOT NULL,
		support_role_id VARCHAR(255) NOT NULL,
		log_channel_id VARCHAR(255),
		title VARCHAR(255) DEFAULT 'Support Ticket',
		description TEXT,
		button_label VARCHAR(255) DEFAULT 'Créer un ticket',
		button_emoji VARCHAR(255)
	  )
	`);

	await pool.execute(`
	  CREATE TABLE IF NOT EXISTS tickets (
		id INT AUTO_INCREMENT PRIMARY KEY,
		guildId VARCHAR(255) NOT NULL,
		ticket_channel_id VARCHAR(255) NOT NULL,
		creator_id VARCHAR(255) NOT NULL,
		status ENUM('open', 'closed') DEFAULT 'open',
		created_at BIGINT NOT NULL,
		closed_at BIGINT,
		closed_by_id VARCHAR(255)
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

// --- Fonctions pour le nouveau système de casier ---

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

// --- Fonctions pour la configuration des tickets ---

async function createTicketConfig(guildId, config) {
	const { name, categoryId, supportRoleId, logChannelId, title, description, buttonLabel, buttonEmoji } = config;
	const [result] = await pool.execute(
		'INSERT INTO ticket_configs (guildId, panel_name, category_id, support_role_id, log_channel_id, title, description, button_label, button_emoji) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
		[guildId, name, categoryId, supportRoleId, logChannelId, title, description, buttonLabel, buttonEmoji]
	);
	return result.insertId;
}

async function updateTicketPanelMessage(configId, messageId, channelId) {
	await pool.execute('UPDATE ticket_configs SET message_id = ?, channel_id = ? WHERE id = ?', [messageId, channelId, configId]);
}

async function getTicketConfigByMessage(messageId) {
	const [rows] = await pool.execute('SELECT * FROM ticket_configs WHERE message_id = ?', [messageId]);
	return rows[0];
}


async function createTicketRecord(guildId, channelId, creatorId, configId) {
	await pool.execute(


		'INSERT INTO tickets (guildId, ticket_channel_id, creator_id, config_id, created_at) VALUES (?, ?, ?, ?, ?)',
		[guildId, channelId, creatorId, configId, Date.now()]
	);
}

async function getTicketByChannel(channelId) {
	const [rows] = await pool.execute('SELECT * FROM tickets WHERE ticket_channel_id = ?', [channelId]);
	return rows[0];
}

async function closeTicket(channelId, closerId) {
	await pool.execute(
		'UPDATE tickets SET status = "closed", closed_at = ?, closed_by_id = ? WHERE ticket_channel_id = ?',
		[Date.now(), closerId, channelId]
	);
}

module.exports = {
	init,
	setGuildSettings,
	getGuildSettings,
	// ... (anciennes fonctions)
	getSanctionsPaginated,
	getLatestActiveSanction,
	revokeSanction,
	// Nouvelles fonctions
	createTicketConfig,
	updateTicketPanelMessage,
	getTicketConfigByMessage,
	createTicketRecord,
	getTicketByChannel,
	closeTicket,
};
