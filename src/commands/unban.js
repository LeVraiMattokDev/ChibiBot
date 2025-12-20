const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');
const { logSanction } = require('../utils/logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unban')
		.setDescription('Révoque le bannissement d\'un utilisateur.')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addStringOption(option =>
			option.setName('utilisateur')
				.setDescription('L\'utilisateur à débannir (ID obligatoire).')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('raison')
				.setDescription('La raison de la révocation du ban.')
				.setRequired(true)),
	async execute(interaction) {
		const userId = interaction.options.getString('utilisateur');
		const reason = interaction.options.getString('raison');
		const revoker = interaction.user;

		await interaction.deferReply({ ephemeral: true });
		
		let targetUser;
		try {
			targetUser = await interaction.client.users.fetch(userId);
		} catch (error) {
			return interaction.editReply(`❌ Utilisateur introuvable pour l'ID : \`${userId}\`.`);
		}

				try {
			// 1. Vérifier si l'utilisateur est réellement banni
			const ban = await interaction.guild.bans.fetch(targetUser.id).catch(() => null);
			if (!ban) {
				return interaction.editReply(`❌ **${targetUser.tag}** n'est pas banni de ce serveur.`);
			}

			// 2. Trouver et révoquer la dernière sanction de ban active dans la DB *avant* l'action Discord
			// Cela prévient les "race conditions" avec le système de unban automatique.
			const latestBan = await db.getLatestActiveSanction(targetUser.id, interaction.guild.id, 'BAN');
			if (latestBan) {
				await db.revokeSanction(latestBan.id, interaction.guild.id, revoker.id, revoker.tag, reason);
			}

			// 3. Révoquer le ban sur Discord
			await interaction.guild.members.unban(targetUser, reason);

			await interaction.editReply(`✅ Le bannissement de **${targetUser.tag}** a été révoqué.`);
			
			await logSanction(interaction, 'UNBAN', targetUser, reason);

		} catch (error) {
			console.error(error);
			// Si le fetch a échoué après la vérification initiale (très peu probable), on donne un message d'erreur générique.
			await interaction.editReply(`❌ Impossible de révoquer le bannissement de **${targetUser.tag}**. Une erreur inattendue est survenue.`);
		}
	},
};
