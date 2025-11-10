const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Affiche la latence du bot et de l\'API.'),
	async execute(interaction) {
		const sent = await interaction.reply({ content: 'Calcul du ping...', fetchReply: true });
		const wsPing = interaction.client.ws.ping;
		const apiLatency = sent.createdTimestamp - interaction.createdTimestamp;

		await interaction.editReply(`Pong! 🏓\nLatence du WebSocket : \`${wsPing}ms\`\nLatence de l'API : \`${apiLatency}ms\``);
	},
};
