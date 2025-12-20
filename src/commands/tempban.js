const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../database');
const { logSanction } = require('../utils/logger');

// Fonction simple pour parser la durée (ex: "7d", "12h", "30m")
function parseDuration(durationString) {
	const regex = /(\d+)([dhm])/;
	const match = durationString.toLowerCase().match(regex);

	if (!match) return null;

	const value = parseInt(match[1]);
	const unit = match[2];
	let milliseconds;

	switch (unit) {
		case 'd':
			milliseconds = value * 24 * 60 * 60 * 1000;
			break;
		case 'h':
			milliseconds = value * 60 * 60 * 1000;
			break;
		case 'm':
			milliseconds = value * 60 * 1000;
			break;
		default:
			return null;
	}
	return milliseconds;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tempban')
		.setDescription('Bannit temporairement un utilisateur.')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addStringOption(option =>
			option.setName('utilisateur')
				.setDescription('L\'utilisateur à bannir (mention ou ID).')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('durée')
				.setDescription('Durée du ban (ex: 7d, 12h, 30m).')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('raison')
				.setDescription('La raison du bannissement.')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('jours_messages')
				.setDescription('Nombre de jours de messages à supprimer (0-7).')
				.setMinValue(0)
				.setMaxValue(7)),

	async execute(interaction) {
		const userInput = interaction.options.getString('utilisateur');
		const durationString = interaction.options.getString('durée');
		const reason = interaction.options.getString('raison');
		const days = interaction.options.getInteger('jours_messages') || 0;

		const durationMs = parseDuration(durationString);
		if (!durationMs) {
			return interaction.reply({ content: '❌ Format de durée invalide. Utilisez `d` pour jours, `h` pour heures, `m` for minutes (ex: "7d").', flags: MessageFlags.Ephemeral });
		}
		
		const expires_at = Date.now() + durationMs;

		const userId = userInput.match(/^<@!?(\d+)>$/)?.[1] || userInput;
		let user;
		try {
			user = await interaction.client.users.fetch(userId);
		} catch (error) {
			return interaction.reply({ content: `❌ Utilisateur introuvable pour l'ID : \`${userId}\`.`, flags: MessageFlags.Ephemeral });
		}

		await interaction.deferReply({ ephemeral: true });

		try {
			await interaction.guild.members.ban(user, { reason: reason, deleteMessageDays: days });
			
			// Sauvegarde en DB avec la date d'expiration
			await db.addSanction(interaction.guild.id, user.id, user.tag, interaction.user.id, interaction.user.tag, 'BAN', reason, durationMs, expires_at);
			
			await interaction.editReply(`✅ **${user.tag}** a été banni temporairement jusqu'au <t:${Math.floor(expires_at / 1000)}:F>. Raison : ${reason}`);
			
			await logSanction(interaction, 'BAN', user, reason, durationString);
			
		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: `Je n'ai pas pu bannir **${user.tag}**. Vérifiez ma hiérarchie de rôles ou si l'utilisateur est déjà banni.` });
		}
	},
};
