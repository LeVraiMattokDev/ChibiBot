const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../database');

/**
 * Envoie un message de log standardisé dans le salon configuré.
 * @param {import('discord.js').Guild} guild Le serveur où l'action a eu lieu.
 * @param {EmbedBuilder} embed L'embed à envoyer.
 */
async function logAction(guild, embed) {
	if (!guild) return;

	try {
		const settings = await db.getGuildSettings(guild.id);
		if (!settings || !settings.log_channel_id) {
			return; // Le salon de log n'est pas configuré
		}

		const logChannel = guild.channels.cache.get(settings.log_channel_id);
		if (!logChannel) {
			return;
		}

		// Vérification des permissions
		if (!logChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages) || 
			!logChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)) {
			console.log(`[WARNING] Missing SendMessages or EmbedLinks permission for log channel in guild ${guild.id}`);
			return;
		}

		await logChannel.send({ embeds: [embed] });
	} catch (error) {
		console.error(`[ERROR] Failed to send log message for guild ${guild.id}:`, error);
	}
}

/**
 * Génère un embed de log pour une sanction et l'envoie.
 * @param {import('discord.js').Interaction} interaction L'interaction qui a déclenché la sanction.
 * @param {string} type Le type de sanction (BAN, KICK, TIMEOUT, UNBAN, UNMUTE).
 * @param {import('discord.js').User} targetUser L'utilisateur sanctionné.
 * @param {string} reason La raison de la sanction.
 * @param {string|number|null} duration La durée de la sanction.
 */
async function logSanction(interaction, type, targetUser, reason, duration = null) {
	const moderator = interaction.user;
	const guild = interaction.guild;
	
	let title = '';
	let color = 0;
	let fields = [];

	switch (type.toUpperCase()) {
		case 'BAN':
			title = 'Membre Banni';
			color = 0xED4245; // Rouge
			fields.push({ name: 'Durée', value: duration || 'Permanente' });
			break;
		case 'UNBAN':
			title = 'Membre Débanni';
			color = 0x57F287; // Vert
			break;
		case 'KICK':
			title = 'Membre Expulsé';
			color = 0xE67E22; // Orange
			break;
		case 'TIMEOUT':
			title = 'Membre Isolé (Timeout)';
			color = 0x5865F2; // Bleu
			fields.push({ name: 'Durée', value: `${duration} minute(s)` });
			break;
		case 'UNMUTE':
			title = 'Membre Rétabli (Unmute)';
			color = 0x57F287; // Vert
			break;
	}

	const embed = new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.addFields(
			{ name: 'Membre', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
			{ name: 'Modérateur', value: `${moderator.tag} (${moderator.id})`, inline: true },
			...fields,
			{ name: 'Raison', value: reason }
		)
		.setTimestamp()
		.setThumbnail(targetUser.displayAvatarURL());

	await logAction(guild, embed);
}


module.exports = { logAction, logSanction };