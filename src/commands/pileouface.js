const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pileouface')
		.setDescription('Lance une pièce de monnaie virtuelle.'),
	async execute(interaction) {
		const result = Math.random() > 0.5 ? 'Pile' : 'Face';
		await interaction.reply(`🪙 La pièce est tombée sur... **${result}** !`);
	},
};
