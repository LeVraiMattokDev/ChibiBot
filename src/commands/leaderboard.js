const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Affiche le classement du serveur.')
		.addStringOption(option =>
			option.setName('type')
				.setDescription('Le type de classement à afficher.')
				.setRequired(true)
				.addChoices(
					{ name: '💰 Argent', value: 'money' },
					{ name: '📈 Niveaux', value: 'level' }
				)),
	async execute(interaction) {
		const type = interaction.options.getString('type');
		
		await interaction.deferReply();

				const leaderboardData = await db.getLeaderboard(interaction.guild.id, type, 10);

		const embed = new EmbedBuilder()
			.setTitle(`Classement du serveur - ${type === 'money' ? '💰 Argent' : '📈 Niveaux'}`)
			.setColor(type === 'money' ? 0xF1C40F : 0x3498DB);

		if (leaderboardData.length === 0) {
			embed.setDescription('Personne n\'est encore classé !');
		} else {
			// On récupère tous les membres du serveur en une fois pour un accès rapide via le cache.
			// C'est beaucoup plus performant que de faire 10 appels API.
			await interaction.guild.members.fetch();

			const leaderboardString = leaderboardData.map((entry, index) => {
				const member = interaction.guild.members.cache.get(entry.userId);
				const username = member ? member.user.username : 'Utilisateur inconnu';
				const rank = index + 1;
				const value = type === 'money'
					? `**${parseFloat(entry.money).toFixed(2)}** pièces`
					: `Niveau **${entry.level}** (${entry.xp} XP)`;
				return `${rank}. **${username}** - ${value}`;
			}).join('\n');
			
			embed.setDescription(leaderboardString);
		}

		await interaction.editReply({ embeds: [embed] });
	},
};
