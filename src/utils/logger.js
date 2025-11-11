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

module.exports = { logAction };
