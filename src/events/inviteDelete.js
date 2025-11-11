const { Events, EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
	name: Events.InviteDelete,
	async execute(invite) {
		const embed = new EmbedBuilder()
			.setColor(0xED4245)
			.setTitle('Invitation Supprimée')
			.setDescription(`L'invitation pour le salon ${invite.channel} (code: \`${invite.code}\`) a été supprimée.`)
			.setTimestamp();
			
		await logAction(invite.guild, embed);
	},
};
