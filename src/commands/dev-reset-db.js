const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const { db: dbConfig } = require('../../config.json');

// ID de l'utilisateur autorisé
const OWNER_ID = '318398917030969345';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dev-reset-db')
		.setDescription('[DANGER] Supprime la table des sanctions pour la mettre à jour.'),
	async execute(interaction) {
		if (interaction.user.id !== OWNER_ID) {
			return interaction.reply({
				content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
				ephemeral: true,
			});
		}

		await interaction.deferReply({ ephemeral: true });

		try {
			const connection = await mysql.createConnection({
				host: process.env.DB_HOST || dbConfig.host,
				port: dbConfig.port,
				user: dbConfig.user,
				password: dbConfig.password,
				database: dbConfig.database,
			});

			await connection.execute('DROP TABLE IF EXISTS sanctions;');
			await connection.end();

			await interaction.editReply({
				content: '✅ Table `sanctions` supprimée. Redémarrez le bot MAINTENANT.',
			});

		} catch (error) {
			console.error('[FATAL DEV COMMAND] Failed to drop table:', error);
			await interaction.editReply({
				content: `❌ Une erreur est survenue : ${error.message}`,
			});
		}
	},
};
