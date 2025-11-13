const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bof')
		.setDescription('Exprime le désintérêt total.'),
	async execute(interaction) {
		await interaction.reply('Bof.');
	},
};
