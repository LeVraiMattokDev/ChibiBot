const { Events, EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
	name: Events.ChannelDelete,
	async execute(channel) {
		const embed = new EmbedBuilder()
			.setColor(0xED4245)
			.setTitle('Salon Supprimé')
			.setDescription(`Le salon \`#${channel.name}\` a été supprimé.`)
			.setTimestamp();
			
		await logAction(channel.guild, embed);
	},
};
