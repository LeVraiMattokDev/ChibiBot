const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const { db: dbConfig } = require('../../config.json');

// ID de l'utilisateur autorisé
const OWNER_ID = '318398917030969345';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dev-update-db')
		.setDescription('[DEV] Applique les mises à jour de structure à la base de données.'),
	async execute(interaction) {
		if (interaction.user.id !== OWNER_ID) {
			return interaction.reply({ content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
		}

		await interaction.deferReply({ ephemeral: true });

		try {
			const connection = await mysql.createConnection({
				host: process.env.DB_HOST || dbConfig.host,
				user: dbConfig.user,
				password: dbConfig.password,
				database: dbConfig.database,
			});

			// -- Commande de mise à jour --
			const alterQuery = `
				ALTER TABLE guild_settings
				ADD COLUMN economy_money_per_message FLOAT DEFAULT 1,
				ADD COLUMN economy_xp_per_message INT DEFAULT 10;
			`;
			await connection.execute(alterQuery);
			
			await connection.end();

			await interaction.editReply({
				content: '✅ La table `guild_settings` a été mise à jour avec succès. Le système d\'économie est prêt.',
			});

		} catch (error) {
			// Si la colonne existe déjà, l'erreur est normale.
			if (error.code === 'ER_DUP_FIELDNAME') {
				return interaction.editReply({
					content: '🟡 Les colonnes pour le système d\'économie existent déjà. Aucune action n\'a été nécessaire.',
				});
			}
			console.error('[FATAL DEV COMMAND] Failed to update table:', error);
			await interaction.editReply({ content: `❌ Une erreur est survenue : ${error.message}` });
		}
	},
};
