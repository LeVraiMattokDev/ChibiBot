const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('loveme')
		.setDescription('Demande de l\'affection au bot.'),
	async execute(interaction) {
		await interaction.reply('Bien sûr que je t\'aime, mon petit chou en sucre ! ❤️');
	},
};
