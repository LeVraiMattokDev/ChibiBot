const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');

// Formule pour l'XP requis par niveau : 5 * (level ^ 2) + 50 * level + 100
function xpForLevel(level) {
    return 5 * (level ** 2) + (50 * level) + 100;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profil')
		.setDescription('Affiche votre profil économique (ou celui d\'un autre membre).')
		.addUserOption(option =>
			option.setName('utilisateur')
				.setDescription('L\'utilisateur dont vous voulez voir le profil.')
				.setRequired(false)),
	async execute(interaction) {
		const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
		
		await interaction.deferReply();

		try {
			const profile = await db.getUserProfile(targetUser.id, interaction.guild.id);
			
			const xpNeeded = xpForLevel(profile.level);
			const progress = Math.floor((profile.xp / xpNeeded) * 100);

			// Barre de progression simple
			const progressBar = '▓'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));

			const embed = new EmbedBuilder()
				.setTitle(`Profil de ${targetUser.username}`)
				.setThumbnail(targetUser.displayAvatarURL())
				.setColor(0x5865F2)
				.addFields(
					{ name: '💰 Argent', value: `${parseFloat(profile.money).toFixed(2)} pièces`, inline: true },
					{ name: '📈 Niveau', value: `${profile.level}`, inline: true },
					{ name: '✨ XP', value: `${profile.xp} / ${xpNeeded}` },
					{ name: 'Progression', value: `\`[${progressBar}]\` (${progress}%)` }
				)
				.setTimestamp();

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error(`Erreur lors de la récupération du profil de ${targetUser.tag}:`, error);
			await interaction.editReply({ content: '❌ Une erreur est survenue lors de la récupération de ce profil.' });
		}
	},
};
