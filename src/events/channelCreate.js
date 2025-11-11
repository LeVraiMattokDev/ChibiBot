const { Events, EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
	name: Events.ChannelCreate,
	async execute(channel) {
		const embed = new EmbedBuilder()
			.setColor(0x57F287)
			.setTitle('Salon Créé')
			.setDescription(`Le salon ${channel} (\`${channel.name}\`) a été créé.`)
			.setTimestamp();
			
		await logAction(channel.guild, embed);
	},
};
