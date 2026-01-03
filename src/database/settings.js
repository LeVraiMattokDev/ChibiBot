const pool = require('./connection');

async function setGuildSettings(guildId, newSettings) {
    const oldSettings = await getGuildSettings(guildId);
    const settings = { ...oldSettings, ...newSettings };

    // On construit une requête "upsert" dynamique pour insérer ou mettre à jour les paramètres.
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

module.exports = { setGuildSettings, getGuildSettings };
