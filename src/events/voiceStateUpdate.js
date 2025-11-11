const { Events, EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
	name: Events.VoiceStateUpdate,
	async execute(oldState, newState) {
		const user = newState.member;
		if (user.user.bot) return;

		let embed;
		const guild = newState.guild;

		// L'utilisateur rejoint un salon vocal
		if (!oldState.channel && newState.channel) {
			embed = new EmbedBuilder()
				.setColor(0x57F287) // Vert
				.setTitle('Vocal : Connexion')
				.setDescription(`**Membre :** ${user.user.tag}\n**Salon :** ${newState.channel.name}`);
		}
		// L'utilisateur quitte un salon vocal
		else if (oldState.channel && !newState.channel) {
			embed = new EmbedBuilder()
				.setColor(0xED4245) // Rouge
				.setTitle('Vocal : Déconnexion')
				.setDescription(`**Membre :** ${user.user.tag}\n**Salon :** ${oldState.channel.name}`);
		}
		// L'utilisateur change de salon vocal
		else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
			embed = new EmbedBuilder()
				.setColor(0x5865F2) // Bleu
				.setTitle('Vocal : Changement de salon')
				.setDescription(`**Membre :** ${user.user.tag}\n**Ancien salon :** ${oldState.channel.name}\n**Nouveau salon :** ${newState.channel.name}`);
		}

		if (embed) {
			embed.setTimestamp().setFooter({ text: `User ID: ${user.id}` });
			await logAction(guild, embed);
		}
	},
};
