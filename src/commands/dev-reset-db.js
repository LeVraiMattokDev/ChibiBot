const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const { db: dbConfig } = require('../../config.json');

// ID de l'utilisateur autorisé
const OWNER_ID = '318398917030969345';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dev-reset-db')
		.setDescription('[DANGER] Supprime la table des sanctions. À n\'utiliser qu\'une seule fois.'),
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
			// Crée une connexion temporaire juste pour cette opération
			const connection = await mysql.createConnection({
				host: process.env.DB_HOST || dbConfig.host,
				port: dbConfig.port,
				user: dbConfig.user,
				password: dbConfig.password,
				database: dbConfig.database,
			});

			// Exécute la commande de suppression
			await connection.execute('DROP TABLE IF EXISTS sanctions;');
			
			// Ferme la connexion temporaire
			await connection.end();

			await interaction.editReply({
				content: '✅ Table `sanctions` supprimée avec succès.\n\n**ACTION REQUISE :** Veuillez **redémarrer le bot MAINTENANT** depuis Pterodactyl pour qu\'il puisse recréer la table avec la nouvelle structure.',
			});

		} catch (error) {
			console.error('[FATAL DEV COMMAND] Failed to drop sanctions table:', error);
			await interaction.editReply({
				content: `❌ Une erreur est survenue lors de la suppression de la table : ${error.message}`,
			});
		}
	},
};
