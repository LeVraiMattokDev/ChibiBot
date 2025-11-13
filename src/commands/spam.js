const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('spam')
		.setDescription('Le bot simule l\'envoi de spam.'),
	async execute(interaction) {
		await interaction.reply('ATTENTION ! Vous avez gagné un an de poutine gratuite ! Cliquez ici pour réclamer votre prix : <https://www.youtube.com/watch?v=dQw4w9WgXcQ>');
	},
};
