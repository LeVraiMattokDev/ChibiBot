const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');
const { logSanction } = require('../../utils/logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unmute')
		.setDescription('Révoque le timeout d\'un utilisateur.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addUserOption(option =>
			option.setName('utilisateur')
				.setDescription('L\'utilisateur dont il faut annuler le timeout.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('raison')
				.setDescription('La raison de la révocation du timeout.')
				.setRequired(true)),
	async execute(interaction) {
		const targetUser = interaction.options.getUser('utilisateur');
		const reason = interaction.options.getString('raison');
		const revoker = interaction.user;

		await interaction.deferReply({ ephemeral: true });

		try {
			const member = await interaction.guild.members.fetch(targetUser.id);
			
			// 1. Révoquer le timeout sur Discord
			await member.timeout(null, reason); // Mettre null retire le timeout

			// 2. Trouver le dernier timeout actif pour cet utilisateur
			const latestTimeout = await db.getLatestActiveSanction(targetUser.id, interaction.guild.id, 'TIMEOUT');
			if (latestTimeout) {
				await db.revokeSanction(latestTimeout.id, interaction.guild.id, revoker.id, revoker.tag, reason);
			}

			await interaction.editReply(`✅ Le timeout de **${targetUser.tag}** a été révoqué.`);

			await logSanction(interaction, 'UNMUTE', targetUser, reason);

		} catch (error) {
			console.error(error);
			await interaction.editReply(`❌ Impossible de révoquer le timeout de **${targetUser.tag}**. L'utilisateur n'est peut-être pas timeout.`);
		}
	},
};
