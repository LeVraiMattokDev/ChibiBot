const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ship')
		.setDescription('Calcule la "compatibilité" humoristique.')
		.addUserOption(option => option.setName('utilisateur1').setDescription('La première personne.').setRequired(true))
		.addUserOption(option => option.setName('utilisateur2').setDescription('La deuxième personne.').setRequired(true)),
	async execute(interaction) {
		const user1 = interaction.options.getUser('utilisateur1');
		const user2 = interaction.options.getUser('utilisateur2');
		const compatibility = Math.floor(Math.random() * 101); // 0-100

		await interaction.reply(`❤️ La compatibilité entre **${user1.username}** et **${user2.username}** est de **${compatibility}%** !`);
	},
};
