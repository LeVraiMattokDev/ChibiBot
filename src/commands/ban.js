const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../database');
const { logSanction } = require('../utils/logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Bannir un utilisateur du serveur.')
		.addStringOption(option =>
			option.setName('utilisateur')
				.setDescription('L\'utilisateur à bannir (mention ou ID).')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('raison')
				.setDescription('La raison du bannissement'))
		.addStringOption(option =>
			option.setName('durée')
				.setDescription('Durée de la sanction (ex: "Permanent", "3 jours"). Pour information dans les logs.'))
		.addIntegerOption(option =>
			option.setName('jours_messages')
				.setDescription('Nombre de jours de messages à supprimer (0-7)')
				.setMinValue(0)
				.setMaxValue(7))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		const userInput = interaction.options.getString('utilisateur');
		const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';
		const duration = interaction.options.getString('durée');
		const days = interaction.options.getInteger('jours_messages') || 0;

		// Extrait l'ID de la mention ou utilise la chaîne si c'est déjà un ID
		const userId = userInput.match(/^<@!?(\d+)>$/)?.[1] || userInput;

		// Tente de récupérer l'objet User
		let user;
		try {
			user = await interaction.client.users.fetch(userId);
		} catch (error) {
			return interaction.reply({ content: `❌ Utilisateur introuvable pour l'ID : \`${userId}\`.`, flags: MessageFlags.Ephemeral });
		}

		if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
			return interaction.reply({ content: 'Je n\'ai pas la permission de bannir des membres.', flags: MessageFlags.Ephemeral });
		}

		try {
			await interaction.guild.members.ban(user, { reason: reason, deleteMessageDays: days });
			await db.addSanction(interaction.guild.id, user.id, user.tag, interaction.user.id, interaction.user.tag, 'BAN', reason);
			await interaction.reply(`**${user.tag}** a été banni pour la raison : **${reason}**`);
			
			// Envoyer le log
			await logSanction(interaction, 'BAN', user, reason, duration);
			
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: `Je n'ai pas pu bannir **${user.tag}**. Vérifiez ma hiérarchie de rôles ou si l'utilisateur est déjà banni.`, flags: MessageFlags.Ephemeral });
		}
	},
};
