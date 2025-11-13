const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Affiche des statistiques drôles du bot.'),
	async execute(interaction) {
		await interaction.reply('**Statistiques Officielles :**\n- Blagues racontées : 7 (dont 2 drôles)\n- Utilisateurs jugés : 42\n- Cafés virtuels consommés : 1337');
	},
};
