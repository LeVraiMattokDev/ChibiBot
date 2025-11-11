const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
	name: Events.RoleUpdate,
	async execute(oldRole, newRole) {
		const guild = newRole.guild;
		let embed;

		// On cherche l'auteur de la modification dans les logs d'audit
		const fetchedLogs = await guild.fetchAuditLogs({
			limit: 1,
			type: AuditLogEvent.RoleUpdate,
		});
		const log = fetchedLogs.entries.first();
		const moderator = (log && log.target.id === newRole.id) ? log.executor.tag : '*(Inconnu)*';

		// Changement de nom
		if (oldRole.name !== newRole.name) {
			embed = new EmbedBuilder()
				.setColor(0x5865F2)
				.setTitle('Rôle Renommé')
				.setDescription(`**Rôle :** ${newRole}\n**Par :** ${moderator}`)
				.addFields(
					{ name: 'Ancien Nom', value: oldRole.name, inline: true },
					{ name: 'Nouveau Nom', value: newRole.name, inline: true }
				);
		}
		// Changement de permissions (plus complexe, on log juste le fait qu'il y a eu un changement)
		else if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
			embed = new EmbedBuilder()
				.setColor(0x5865F2)
				.setTitle('Permissions de Rôle Modifiées')
				.setDescription(`Les permissions pour le rôle ${newRole} ont été modifiées par **${moderator}**.`);
		}

		if (embed) {
			embed.setTimestamp();
			await logAction(guild, embed);
		}
	},
};
