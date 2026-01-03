	// On s'assure que toutes les tables nécessaires existent au démarrage.
	await pool.execute(`
	  CREATE TABLE IF NOT EXISTS sanctions (
		id INT AUTO_INCREMENT PRIMARY KEY, guildId VARCHAR(255) NOT NULL, userId VARCHAR(255) NOT NULL,
		userName VARCHAR(255) NOT NULL, moderatorId VARCHAR(255) NOT NULL, moderatorName VARCHAR(255) NOT NULL,
		type VARCHAR(255) NOT NULL, reason TEXT, duration INT, timestamp BIGINT NOT NULL, expires_at BIGINT,
		revoked BOOLEAN DEFAULT FALSE, revoked_by_id VARCHAR(255), revoked_by_name VARCHAR(255),
		revoked_reason VARCHAR(255), revoked_timestamp BIGINT
	  )`);

	await pool.execute(`
	  CREATE TABLE IF NOT EXISTS guild_settings (
		guildId VARCHAR(255) PRIMARY KEY, 
		welcome_enabled BOOLEAN DEFAULT FALSE, welcome_channel_id VARCHAR(255), welcome_message TEXT,
		log_enabled BOOLEAN DEFAULT TRUE, log_channel_id VARCHAR(255),
		economy_enabled BOOLEAN DEFAULT TRUE, economy_money_per_message FLOAT DEFAULT 1,
		xp_enabled BOOLEAN DEFAULT TRUE, economy_xp_per_message INT DEFAULT 10,
		shop_enabled BOOLEAN DEFAULT TRUE
	  )`);

	await pool.execute(`
	  CREATE TABLE IF NOT EXISTS user_profiles (
		userId VARCHAR(255) NOT NULL, guildId VARCHAR(255) NOT NULL, money DECIMAL(15, 2) DEFAULT 0.00,
		xp INT DEFAULT 0, level INT DEFAULT 0, last_message_timestamp BIGINT DEFAULT 0,
		PRIMARY KEY (userId, guildId)
	  )`);

	await pool.execute(`
	  CREATE TABLE IF NOT EXISTS shop_items (
		id INT AUTO_INCREMENT PRIMARY KEY, guildId VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL,
		description TEXT, price DECIMAL(15, 2) NOT NULL, UNIQUE KEY (guildId, name)
	  )`);
	
	await pool.execute(`
	  CREATE TABLE IF NOT EXISTS user_inventories (
		id INT AUTO_INCREMENT PRIMARY KEY, guildId VARCHAR(255) NOT NULL, userId VARCHAR(255) NOT NULL,
		item_id INT NOT NULL, quantity INT DEFAULT 1,
		FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE,
		UNIQUE KEY (guildId, userId, item_id)
	  )`);

	console.log('MariaDB connection pool created and tables checked.');


async function setGuildSettings(guildId, newSettings) {
	const oldSettings = await getGuildSettings(guildId);
	const settings = { ...oldSettings, ...newSettings };

	// On construit une requête "upsert" dynamique pour insérer ou mettre à jour les paramètres.
	// C'est plus propre et plus performant que de faire un SELECT puis un INSERT/UPDATE.
	const fields = Object.keys(settings).filter(k => k !== 'guildId');
	const values = fields.map(k => settings[k]);
	const assignments = fields.map(field => `${field} = VALUES(${field})`).join(', ');

	const sql = `
		INSERT INTO guild_settings (guildId, ${fields.join(', ')})
		VALUES (?, ${fields.map(() => '?').join(', ')})
		ON DUPLICATE KEY UPDATE ${assignments}`;
	
	await pool.execute(sql, [guildId, ...values]);
}

async function getGuildSettings(guildId) {
	const [rows] = await pool.execute('SELECT * FROM guild_settings WHERE guildId = ?', [guildId]);
	if (rows.length > 0) {
		return rows[0];
	}

	// Si un serveur n'a pas de configuration, on en crée une par défaut.
	// C'est mieux que de devoir vérifier partout dans le code si settings existe.
	const defaultSettings = {
		guildId: guildId,
		welcome_enabled: false,
		welcome_channel_id: null,
		welcome_message: null,
		log_enabled: true,
		log_channel_id: null,
		economy_enabled: true,
		economy_money_per_message: 1,
		xp_enabled: true,
		economy_xp_per_message: 10,
		shop_enabled: true
	};

	await setGuildSettings(guildId, defaultSettings);

	// On retourne directement l'objet par défaut pour éviter une seconde requête à la DB.
	return defaultSettings;
}

async function getUserProfile(userId, guildId) {
	const [rows] = await pool.execute('SELECT * FROM user_profiles WHERE userId = ? AND guildId = ?', [userId, guildId]);
	if (rows.length > 0) {
		return rows[0];
	}

	// Si un utilisateur n'a pas de profil, on lui en crée un à la volée.
	const defaultProfile = {
		userId: userId,
		guildId: guildId,
		money: 0.00,
		xp: 0,
		level: 0,
		last_message_timestamp: 0
	};
	
	await pool.execute('INSERT INTO user_profiles (userId, guildId) VALUES (?, ?)', [userId, guildId]);
	
	// On retourne l'objet par défaut pour éviter un second SELECT.
	return defaultProfile;
}

async function updateUserProfile(userId, guildId, data) {
	const fields = Object.keys(data);
	const assignments = fields.map(field => `${field} = ?`).join(', ');
	const sql = `UPDATE user_profiles SET ${assignments} WHERE userId = ? AND guildId = ?`;
	await pool.execute(sql, [...Object.values(data), userId, guildId]);
}

async function addShopItem(guildId, name, description, price) {
	await pool.execute('INSERT INTO shop_items (guildId, name, description, price) VALUES (?, ?, ?, ?)', [guildId, name, description, price]);
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

async function getUserInventory(guildId, userId) {
	const sql = `SELECT si.name, si.description, ui.quantity FROM user_inventories ui JOIN shop_items si ON ui.item_id = si.id WHERE ui.guildId = ? AND ui.userId = ?`;
	const [rows] = await pool.execute(sql, [guildId, userId]);
	return rows;
}

async function addUserItemToInventory(guildId, userId, itemId) {
	const sql = `INSERT INTO user_inventories (guildId, userId, item_id, quantity) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1`;
	await pool.execute(sql, [guildId, userId, itemId]);
}

async function getLeaderboard(guildId, type = 'money', limit = 10) {
	const orderBy = type === 'level' ? 'level DESC, xp DESC' : 'money DESC';
	const [rows] = await pool.execute(
		`SELECT userId, money, level, xp FROM user_profiles WHERE guildId = ? ORDER BY ${orderBy} LIMIT ?`,
		[guildId, limit]
	);
	return rows;
}

async function addSanction(guildId, userId, userName, moderatorId, moderatorName, type, reason, duration = null, expires_at = null) {
	const timestamp = Date.now();
	await pool.execute('INSERT INTO sanctions (guildId, userId, userName, moderatorId, moderatorName, type, reason, duration, timestamp, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [guildId, userId, userName, moderatorId, moderatorName, type, reason, duration, timestamp, expires_at]);
}

async function getSanctionsPaginated(guildId, page, limit, userId = null) {
	const offset = (page - 1) * limit;
	let sql = 'SELECT * FROM sanctions WHERE guildId = ?';
	const params = [guildId];
	if (userId) { sql += ' AND userId = ?'; params.push(userId); }
	sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
	params.push(limit, offset);
	const [rows] = await pool.execute(sql, params);
	return rows;
}

async function countSanctions(guildId, userId = null) {
	let sql = 'SELECT COUNT(id) as count FROM sanctions WHERE guildId = ?';
	const params = [guildId];
	if (userId) { sql += ' AND userId = ?'; params.push(userId); }
	const [rows] = await pool.execute(sql, params);
	return rows[0].count;
}

async function getExpiredBans() {
	const [rows] = await pool.execute('SELECT * FROM sanctions WHERE type = ? AND revoked = FALSE AND expires_at IS NOT NULL AND expires_at <= ?', ['BAN', Date.now()]);
	return rows;
}

async function getLatestActiveSanction(userId, guildId, type) {
	const [rows] = await pool.execute('SELECT id FROM sanctions WHERE userId = ? AND guildId = ? AND type = ? AND revoked = FALSE ORDER BY timestamp DESC LIMIT 1', [userId, guildId, type]);
	return rows[0];
}

async function revokeSanction(sanctionId, guildId, revokerId, revokerName, reason) {
	const timestamp = Date.now();
	const [result] = await pool.execute('UPDATE sanctions SET revoked = TRUE, revoked_by_id = ?, revoked_by_name = ?, revoked_reason = ?, revoked_timestamp = ? WHERE id = ? AND guildId = ?', [revokerId, revokerName, reason, timestamp, sanctionId, guildId]);
	return result.affectedRows;
}

module.exports = {
	init, setGuildSettings, getGuildSettings,
	getUserProfile, updateUserProfile, addShopItem, removeShopItem, getShopItem, getShopItems, getUserInventory, addUserItemToInventory, getLeaderboard,
	addSanction, getSanctionsPaginated, countSanctions, getExpiredBans, getLatestActiveSanction, revokeSanction
};

