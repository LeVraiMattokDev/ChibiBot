const { Events, EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
	name: Events.MessageDelete,
	async execute(message) {
		// Ignore les messages partiels (non-cachés) ou les messages de bots
		if (message.partial || message.author.bot) return;

		const embed = new EmbedBuilder()
			.setColor(0xED4245) // Rouge
			.setTitle('Message Supprimé')
			.setDescription(`**Auteur :** ${message.author.tag} (${message.author.id})\n**Salon :** ${message.channel}`)
			.addFields({ name: 'Contenu du message', value: message.content || '*(Contenu non disponible)*' })
			.setTimestamp()
			.setFooter({ text: `Message ID: ${message.id}` });

		await logAction(message.guild, embed);
	},
};
