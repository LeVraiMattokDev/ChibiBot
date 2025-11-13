const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fakestats')
		.setDescription('Affiche de fausses statistiques amusantes sur le bot.'),
	async execute(interaction) {
		await interaction.reply('**Statistiques Officielles :**\n- Blagues racontées : 7 (dont 2 drôles)\n- Utilisateurs jugés : 42\n- Cafés virtuels consommés : 1337');
	},
};
