const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../database');

// ID de l'utilisateur autorisé
const OWNER_ID = '318398917030969345';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test-addsanction')
		.setDescription('[DEV] Ajoute une fausse sanction dans la base de données pour tester.')
		.addUserOption(option =>
			option.setName('utilisateur')
				.setDescription('L\'utilisateur cible de la fausse sanction.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('type')
				.setDescription('Le type de la fausse sanction.')
				.setRequired(true)
				.addChoices(
					{ name: 'BAN', value: 'BAN' },
					{ name: 'KICK', value: 'KICK' },
					{ name: 'TIMEOUT', value: 'TIMEOUT' },
				))
		.addStringOption(option =>
			option.setName('raison')
				.setDescription('La raison de la fausse sanction.')),
	async execute(interaction) {
		// --- Vérification de l'autorisation ---
		if (interaction.user.id !== OWNER_ID) {
			return interaction.reply({
				content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
				flags: MessageFlags.Ephemeral
			});
		}

		const targetUser = interaction.options.getUser('utilisateur');
		const type = interaction.options.getString('type');
		const reason = interaction.options.getString('raison') || 'Raison de test';
		const duration = type === 'TIMEOUT' ? 10 : null; // Ajoute une durée de 10 min pour les faux timeouts

		try {
			await db.addSanction(
				interaction.guild.id,
				targetUser.id,
				targetUser.tag,
				interaction.user.id,
				interaction.user.tag,
				type,
				reason,
				duration
			);

			await interaction.reply({
				content: `✅ Fausse sanction de type **${type}** ajoutée pour **${targetUser.tag}** dans la base de données.`,
				flags: MessageFlags.Ephemeral
			});
		} catch (error) {
			console.error('[ERROR] Failed to add test sanction:', error);
			await interaction.reply({
				content: '❌ Une erreur est survenue lors de l\'ajout de la sanction de test.',
				flags: MessageFlags.Ephemeral
			});
		}
	},
};

