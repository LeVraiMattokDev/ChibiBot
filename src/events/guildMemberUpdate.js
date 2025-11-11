const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
	name: Events.GuildMemberUpdate,
	async execute(oldMember, newMember) {
		const guild = newMember.guild;
		let embed;

		// Changement de surnom
		if (oldMember.nickname !== newMember.nickname) {
			embed = new EmbedBuilder()
				.setColor(0x5865F2)
				.setTitle('Surnom Modifié')
				.setDescription(`**Membre :** ${newMember.user.tag}`)
				.addFields(
					{ name: 'Ancien Surnom', value: oldMember.nickname || '*(Aucun)*', inline: true },
					{ name: 'Nouveau Surnom', value: newMember.nickname || '*(Aucun)*', inline: true }
				);
		}

		// Changement de rôles
		const oldRoles = oldMember.roles.cache;
		const newRoles = newMember.roles.cache;
		if (oldRoles.size !== newRoles.size) {
			// On cherche dans les logs d'audit qui a fait le changement
			const fetchedLogs = await guild.fetchAuditLogs({
				limit: 1,
				type: AuditLogEvent.MemberRoleUpdate,
			});
			const roleLog = fetchedLogs.entries.first();
			let moderator = '*(Inconnu)*';
			if (roleLog && roleLog.target.id === newMember.id) {
				moderator = roleLog.executor.tag;
			}

			const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
			const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));
			
			if (addedRoles.size > 0) {
				embed = new EmbedBuilder()
					.setColor(0x57F287)
					.setTitle('Rôle Ajouté à un Membre')
					.setDescription(`**Membre :** ${newMember.user.tag}\n**Rôle ajouté :** ${addedRoles.map(r => r.name).join(', ')}\n**Par :** ${moderator}`);
			} else if (removedRoles.size > 0) {
				embed = new EmbedBuilder()
					.setColor(0xED4245)
					.setTitle('Rôle Retiré à un Membre')
					.setDescription(`**Membre :** ${newMember.user.tag}\n**Rôle retiré :** ${removedRoles.map(r => r.name).join(', ')}\n**Par :** ${moderator}`);
			}
		}

		if (embed) {
			embed.setTimestamp().setFooter({ text: `User ID: ${newMember.id}` });
			await logAction(guild, embed);
		}
	},
};
