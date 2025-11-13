const { SlashCommandBuilder, EmbedBuilder, version: djsVersion } = require('discord.js');
const { version } = require('../../package.json');
const os = require('os');

function formatUptime(uptime) {
    const totalSeconds = uptime / 1000;
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${days}j ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Affiche les statistiques réelles et techniques du bot.'),
	async execute(interaction) {
		const client = interaction.client;
		
		// Calculs
		const memoryUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
		const uptime = formatUptime(client.uptime);
		const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

		const embed = new EmbedBuilder()
			.setColor(0x5865F2) // Bleu Discord
			.setTitle(`Statistiques de ${client.user.username}`)
			.setThumbnail(client.user.displayAvatarURL())
			.addFields(
				{ name: '📊 Serveurs', value: `${client.guilds.cache.size} serveurs`, inline: true },
				{ name: '👥 Utilisateurs', value: `${totalUsers} au total`, inline: true },
				{ name: '⏱️ Uptime', value: uptime, inline: true },
				{ name: '🧠 Mémoire', value: `${memoryUsage} MB`, inline: true },
				{ name: '🤖 Version Bot', value: `v${version}`, inline: true },
				{ name: '📚 Version Discord.js', value: `v${djsVersion}`, inline: true },
				{ name: '🟩 Version Node.js', value: process.version, inline: true }
			)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
