const { Events, EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
	name: Events.RoleDelete,
	async execute(role) {
		const embed = new EmbedBuilder()
			.setColor(0xED4245)
			.setTitle('Rôle Supprimé')
			.setDescription(`Le rôle \`@${role.name}\` a été supprimé.`)
			.setTimestamp();
			
		await logAction(role.guild, embed);
	},
};
