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
			.setColor(0x5865F2)
			.setTitle(`Statistiques de ${client.user.username}`)
			.setThumbnail(client.user.displayAvatarURL())
			.setDescription('Voici quelques informations sur moi !')
			.addFields(
				{ name: '📊 Au service de', value: `${client.guilds.cache.size} serveurs`, inline: true },
				{ name: '👥 Auprès de', value: `${totalUsers} utilisateurs`, inline: true },
				{ name: '⏱️ En ligne depuis', value: uptime, inline: true },
				{ name: '🧠 Mémoire utilisée', value: `${memoryUsage} MB`, inline: true },
				{ name: '🤖 Ma version', value: `v${version}`, inline: true },
				{ name: '🎂 Créé le', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:D>`, inline: true }
			)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
