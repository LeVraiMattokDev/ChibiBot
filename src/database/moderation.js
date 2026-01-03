const pool = require('./connection');

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

module.exports = { addSanction, getSanctionsPaginated, countSanctions, getExpiredBans, getLatestActiveSanction, revokeSanction };
