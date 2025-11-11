const { Events, EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
	name: Events.InviteCreate,
	async execute(invite) {
		const embed = new EmbedBuilder()
			.setColor(0x57F287)
			.setTitle('Invitation Créée')
			.setDescription(`**Créateur :** ${invite.inviter.tag}\n**Salon :** ${invite.channel}\n**Code :** \`${invite.code}\``)
			.setTimestamp();
			
		await logAction(invite.guild, embed);
	},
};
