const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rate')
		.setDescription('Note quelque chose ou quelqu\'un sur 10.')
		.addStringOption(option => option.setName('cible').setDescription('La chose à noter.').setRequired(true)),
	async execute(interaction) {
		const target = interaction.options.getString('cible');
		const rating = Math.floor(Math.random() * 11); // 0-10
		await interaction.reply(`Je donne à **${target}** la note de **${rating}/10**.`);
	},
};
