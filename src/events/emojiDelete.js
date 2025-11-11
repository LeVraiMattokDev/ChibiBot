const { Events, EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
	name: Events.GuildEmojiDelete,
	async execute(emoji) {
		const embed = new EmbedBuilder()
			.setColor(0xED4245)
			.setTitle('Emoji Supprimé')
			.setDescription(`L'emoji \`:${emoji.name}:\` a été supprimé.`)
			.setTimestamp();
			
		await logAction(emoji.guild, embed);
	},
};
