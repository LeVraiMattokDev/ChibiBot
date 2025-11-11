const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../database');
const { logSanction } = require('../../utils/logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Expulser un utilisateur du serveur.')
		.addUserOption(option =>
			option.setName('utilisateur')
				.setDescription('L\'utilisateur à expulser')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('raison')
				.setDescription('La raison de l\'expulsion'))
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
	async execute(interaction) {
		const user = interaction.options.getUser('utilisateur');
		const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';

		if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
			return interaction.reply({ content: 'Je n\'ai pas la permission d\'expulser des membres.', flags: MessageFlags.Ephemeral });
		}

		try {
			await interaction.guild.members.kick(user, { reason: reason });
			await db.addSanction(interaction.guild.id, user.id, user.tag, interaction.user.id, interaction.user.tag, 'KICK', reason);
			await interaction.reply(`**${user.tag}** a été expulsé pour la raison : **${reason}**`);
			
			await logSanction(interaction, 'KICK', user, reason);

		} catch (error) {
			console.error(error);
			await interaction.reply({ content: `Je n'ai pas pu expulser **${user.tag}**. Vérifiez ma hiérarchie de rôles.`, flags: MessageFlags.Ephemeral });
		}
	},
};
