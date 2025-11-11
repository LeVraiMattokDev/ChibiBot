const { Events, EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
	name: Events.GuildEmojiCreate,
	async execute(emoji) {
		const embed = new EmbedBuilder()
			.setColor(0x57F2
)
			.setTitle('Emoji Ajouté')
			.setDescription(`L'emoji ${emoji} (\`:${emoji.name}:\`) a été ajouté.`)
			.setTimestamp();
			
		await logAction(emoji.guild, embed);
	},
};
