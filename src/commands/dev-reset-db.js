const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const { db: dbConfig } = require('../../config.json');

// ID de l'utilisateur autorisé
const OWNER_ID = '318398917030969345';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dev-reset-db')
		.setDescription('[DANGER] Supprime une table de la DB. À n\'utiliser qu\'une seule fois.'),
	async execute(interaction) {
		// --- Vérification de l'autorisation ---
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

			// Exécute la commande de suppression pour la table des configurations
			await connection.execute('DROP TABLE IF EXISTS guild_settings;');
			
			await connection.end();

			await interaction.editReply({
				content: '✅ Table `guild_settings` supprimée avec succès.\n\n**ACTION REQUISE :** Veuillez **redémarrer le bot MAINTENANT** pour qu\'il recrée la table.',
			});

		} catch (error) {
			console.error('[FATAL DEV COMMAND] Failed to drop table:', error);
			await interaction.editReply({
				content: `❌ Une erreur est survenue : ${error.message}`,
			});
		}
	},
};
