const pool = require('./connection');

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

module.exports = { addShopItem, removeShopItem, getShopItem, getShopItems, getUserInventory, addUserItemToInventory };
