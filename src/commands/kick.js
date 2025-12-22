const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../database');
const { logSanction } = require('../utils/logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Expulser un utilisateur du serveur.')
				.addMemberOption(option =>
			option.setName('utilisateur')
				.setDescription('L\'utilisateur à expulser')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('raison')
				.setDescription('La raison de l\'expulsion'))
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
		async execute(interaction) {
		const member = interaction.options.getMember('utilisateur');
		const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';

		if (!member) {
			return interaction.reply({ content: "Cet utilisateur n'est pas sur le serveur.", flags: MessageFlags.Ephemeral });
		}
		if (member.id === interaction.user.id) {
			return interaction.reply({ content: "Vous ne pouvez pas vous expulser vous-même !", flags: MessageFlags.Ephemeral });
		}
		if (member.id === interaction.client.user.id) {
			return interaction.reply({ content: "Je ne peux pas m'expulser moi-même !", flags: MessageFlags.Ephemeral });
		}
		if (!member.kickable) {
			return interaction.reply({ content: "Je n'ai pas les permissions nécessaires pour expulser cet utilisateur. Mon rôle est peut-être trop bas.", flags: MessageFlags.Ephemeral });
		}

		try {
			await member.kick(reason);
			await db.addSanction(interaction.guild.id, member.id, member.user.tag, interaction.user.id, interaction.user.tag, 'KICK', reason);
			await interaction.reply(`**${member.user.tag}** a été expulsé pour la raison : **${reason}**`);
			
			await logSanction(interaction, 'KICK', member.user, reason);

		} catch (error) {
			console.error(error);
			await interaction.reply({ content: `Une erreur est survenue lors de l'expulsion de **${member.user.tag}**.`, flags: MessageFlags.Ephemeral });
		}
	},
};
