const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Bannir un utilisateur du serveur.')
		.addUserOption(option =>
			option.setName('utilisateur')
				.setDescription('L\'utilisateur à bannir')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('raison')
				.setDescription('La raison du bannissement'))
		.addIntegerOption(option =>
			option.setName('jours_messages')
				.setDescription('Nombre de jours de messages à supprimer (0-7)')
				.setMinValue(0)
				.setMaxValue(7))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		const user = interaction.options.getUser('utilisateur');
		const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';
		const days = interaction.options.getInteger('jours_messages') || 0;

		if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
			return interaction.reply({ content: 'Je n\'ai pas la permission de bannir des membres.', flags: MessageFlags.Ephemeral });
		}

		try {
			await interaction.guild.members.ban(user, { reason: reason, deleteMessageDays: days });
			db.addSanction(interaction.guild.id, user.id, user.tag, interaction.user.id, interaction.user.tag, 'BAN', reason);
			await interaction.reply(`**${user.tag}** a été banni pour la raison : **${reason}**`);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: `Je n'ai pas pu bannir **${user.tag}**. Vérifiez ma hiérarchie de rôles.`, flags: MessageFlags.Ephemeral });
		}
	},
};
