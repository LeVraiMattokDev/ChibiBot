const { Events, EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
	name: Events.MessageUpdate,
	async execute(oldMessage, newMessage) {
		// Ignore les messages partiels, les messages de bots, ou si le contenu n'a pas changé (seuls les embeds ont été ajoutés par ex.)
		if (oldMessage.partial || newMessage.partial || oldMessage.author.bot || oldMessage.content === newMessage.content) return;

		const embed = new EmbedBuilder()
			.setColor(0x5865F2) // Bleu Discord
			.setTitle('Message Modifié')
			.setURL(newMessage.url)
			.setDescription(`**Auteur :** ${newMessage.author.tag} (${newMessage.author.id})\n**Salon :** ${newMessage.channel}`)
			.addFields(
				{ name: 'Ancien Contenu', value: oldMessage.content.slice(0, 1024) || '*(Contenu non disponible)*' },
				{ name: 'Nouveau Contenu', value: newMessage.content.slice(0, 1024) || '*(Contenu non disponible)*' }
			)
			.setTimestamp()
			.setFooter({ text: `Message ID: ${newMessage.id}` });

		await logAction(newMessage.guild, embed);
	},
};
