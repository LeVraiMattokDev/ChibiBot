const pool = require('./connection');

async function init() {
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
}

module.exports = { init };
