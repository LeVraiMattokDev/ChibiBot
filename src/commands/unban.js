const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');
const { logSanction } = require('../utils/logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unban')
		.setDescription('Révoque le bannissement d\'un utilisateur.')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addUserOption(option =>
			option.setName('utilisateur')
				.setDescription('L\'utilisateur à débannir.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('raison')
				.setDescription('La raison de la révocation du ban.')
				.setRequired(true)),
	async execute(interaction) {
		const targetUser = interaction.options.getUser('utilisateur');
		const reason = interaction.options.getString('raison');
		const revoker = interaction.user;

		await interaction.deferReply({ ephemeral: true });

		try {
			// 1. Révoquer le ban sur Discord
			await interaction.guild.members.unban(targetUser, reason);

			// 2. Trouver la dernière sanction de ban active pour cet utilisateur
			const latestBan = await db.getLatestActiveSanction(targetUser.id, interaction.guild.id, 'BAN');
			if (latestBan) {
				await db.revokeSanction(latestBan.id, interaction.guild.id, revoker.id, revoker.tag, reason);
			}

			await interaction.editReply(`✅ Le bannissement de **${targetUser.tag}** a été révoqué.`);
			
			await logSanction(interaction, 'UNBAN', targetUser, reason);

		} catch (error) {
			console.error(error);
			await interaction.editReply(`❌ Impossible de révoquer le bannissement de **${targetUser.tag}**. L'utilisateur n'est peut-être pas banni.`);
		}
	},
};
