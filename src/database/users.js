const pool = require('./connection');

/**
 * Récupère le profil d'un utilisateur sur un serveur donné.
 * Crée un profil par défaut s'il n'existe pas.
 * @param {string} userId L'ID de l'utilisateur Discord.
 * @param {string} guildId L'ID du serveur Discord.
 * @returns {Promise<Object>} Le profil utilisateur.
 */
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

/**
 * Met à jour les données du profil d'un utilisateur.
 * @param {string} userId L'ID de l'utilisateur.
 * @param {string} guildId L'ID du serveur.
 * @param {Object} data Un objet contenant les champs à mettre à jour (ex: { money: 100, xp: 50 }).
 * @returns {Promise<void>}
 */
async function updateUserProfile(userId, guildId, data) {
    const fields = Object.keys(data);
    const assignments = fields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE user_profiles SET ${assignments} WHERE userId = ? AND guildId = ?`;
    await pool.execute(sql, [...Object.values(data), userId, guildId]);
}

async function getLeaderboard(guildId, type = 'money', limit = 10) {
    const orderBy = type === 'level' ? 'level DESC, xp DESC' : 'money DESC';
    const [rows] = await pool.execute(
        `SELECT userId, money, level, xp FROM user_profiles WHERE guildId = ? ORDER BY ${orderBy} LIMIT ?`,
        [guildId, limit]
    );
    return rows;
}

module.exports = { getUserProfile, updateUserProfile, getLeaderboard };
