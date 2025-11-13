const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('secret')
		.setDescription('Révèle un "secret" évidemment faux.'),
	async execute(interaction) {
		await interaction.reply('||Je suis en réalité trois loutres dans un imperméable.||');
	},
};
