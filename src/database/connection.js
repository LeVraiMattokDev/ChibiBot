const mysql = require('mysql2/promise');
// Remarque: on remonte de deux niveaux pour atteindre le config.json
const { dbHost, dbUser, dbPassword, dbName } = require('../../config.json');

const pool = mysql.createPool({
	host: dbHost,
	user: dbUser,
	password: dbPassword,
	database: dbName,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
});

module.exports = pool;
