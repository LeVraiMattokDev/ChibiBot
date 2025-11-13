const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fakepub')
		.setDescription('Le bot simule l\'envoi d\'une fausse pub.'),
	async execute(interaction) {
		await interaction.reply('ATTENTION ! Vous avez gagné un an de poutine gratuite ! Cliquez ici pour réclamer votre prix : <https://www.youtube.com/watch?v=dQw4w9WgXcQ>');
	},
};
