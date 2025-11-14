const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const { db: dbConfig } = require('../../config.json');

const OWNER_ID = '318398917030969345';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dev-update-schema')
		.setDescription('[DEV] Applique les mises à jour de structure à la DB (v1.1.0).'),
	async execute(interaction) {
		if (interaction.user.id !== OWNER_ID) {
			return interaction.reply({ content: '❌ Accès refusé.', ephemeral: true });
		}

		await interaction.deferReply({ ephemeral: true });

		try {
			const connection = await mysql.createConnection({
				host: process.env.DB_HOST || dbConfig.host,
				user: dbConfig.user,
				password: dbConfig.password,
				database: dbConfig.database,
			});

			// Ajoute les nouvelles colonnes `*_enabled` à guild_settings
			// Utilise des requêtes séparées pour ignorer les erreurs si une colonne existe déjà
			const queries = [
				"ALTER TABLE guild_settings ADD COLUMN log_enabled BOOLEAN DEFAULT TRUE",
				"ALTER TABLE guild_settings ADD COLUMN economy_enabled BOOLEAN DEFAULT TRUE",
				"ALTER TABLE guild_settings ADD COLUMN xp_enabled BOOLEAN DEFAULT TRUE",
				"ALTER TABLE guild_settings ADD COLUMN shop_enabled BOOLEAN DEFAULT TRUE"
			];

			let updatedCount = 0;
			for (const query of queries) {
				try {
					await connection.execute(query);
					updatedCount++;
				} catch (error) {
					if (error.code !== 'ER_DUP_FIELDNAME') throw error;
				}
			}
			
			await connection.end();

			if (updatedCount > 0) {
				await interaction.editReply({
					content: `✅ La table \`guild_settings\` a été mise à jour avec succès. ${updatedCount} colonne(s) ajoutée(s).`,
				});
			} else {
				await interaction.editReply({
					content: '🟡 La structure de la table est déjà à jour. Aucune action n\'a été nécessaire.',
				});
			}

		} catch (error) {
			console.error('[FATAL DEV COMMAND] Failed to update table:', error);
			await interaction.editReply({ content: `❌ Une erreur est survenue : ${error.message}` });
		}
	},
};
