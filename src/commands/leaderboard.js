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
			// On va chercher les pseudos à partir des ID
			const leaderboardPromises = leaderboardData.map(async (entry, index) => {
				const user = await interaction.client.users.fetch(entry.userId).catch(() => ({ username: 'Utilisateur inconnu' }));
				const rank = index + 1;
				const value = type === 'money'
					? `${parseFloat(entry.money).toFixed(2)} pièces`
					: `Niveau ${entry.level} (${entry.xp} XP)`;
				return `${rank}. **${user.username}** - ${value}`;
			});
			
			const leaderboardString = (await Promise.all(leaderboardPromises)).join('\n');
			embed.setDescription(leaderboardString);
		}

		await interaction.editReply({ embeds: [embed] });
	},
};
