const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
	name: Events.ChannelUpdate,
	async execute(oldChannel, newChannel) {
		const guild = newChannel.guild;
		if (!guild) return;
		let embed;

		const fetchedLogs = await guild.fetchAuditLogs({
			limit: 1,
			type: AuditLogEvent.ChannelUpdate,
		});
		const log = fetchedLogs.entries.first();
		const moderator = (log && log.target.id === newChannel.id) ? log.executor.tag : '*(Inconnu)*';
		
		if (oldChannel.name !== newChannel.name) {
			embed = new EmbedBuilder()
				.setColor(0x5865F2)
				.setTitle('Salon Renommé')
				.setDescription(`Le salon ${newChannel} a été renommé par **${moderator}**.\n\`${oldChannel.name}\` ➔ \`${newChannel.name}\``);
		} else if (oldChannel.topic !== newChannel.topic) {
			embed = new EmbedBuilder()
				.setColor(0x5865F2)
				.setTitle('Sujet de Salon Modifié')
				.setDescription(`Le sujet du salon ${newChannel} a été modifié par **${moderator}**.`);
		}
		// On peut ajouter d'autres vérifications ici (permissions, etc.)

		if (embed) {
			embed.setTimestamp();
			await logAction(guild, embed);
		}
	},
};
