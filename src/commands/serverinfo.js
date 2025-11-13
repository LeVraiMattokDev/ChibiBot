const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('serverinfo')
		.setDescription('Affiche des informations détaillées sur le serveur actuel.'),
	async execute(interaction) {
		const guild = interaction.guild;
		// On s'assure de récupérer tous les membres pour un comptage précis
		await guild.members.fetch();

		// Comptages
		const owner = await guild.fetchOwner();
		const totalMembers = guild.memberCount;
		const humanMembers = guild.members.cache.filter(member => !member.user.bot).size;
		const botMembers = totalMembers - humanMembers;

		const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
		const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
		const categoryChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;

		const roleCount = guild.roles.cache.size;
		const emojiCount = guild.emojis.cache.size;

		const embed = new EmbedBuilder()
			.setColor(0xFEE75C) // Jaune
			.setTitle(`Informations sur ${guild.name}`)
			.setThumbnail(guild.iconURL({ dynamic: true }))
			.addFields(
				{ name: '👑 Propriétaire', value: owner.user.tag, inline: true },
				{ name: '📅 Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
				{ name: '🆔 ID du serveur', value: guild.id, inline: true },
				
				{ name: `👥 Membres (${totalMembers})`, value: `**Humains :** ${humanMembers}\n**Bots :** ${botMembers}`, inline: true },
				{ name: `💬 Salons (${textChannels + voiceChannels})`, value: `**Texte :** ${textChannels}\n**Vocal :** ${voiceChannels}`, inline: true },
				{ name: `📂 Catégories`, value: `${categoryChannels}`, inline: true },
				
				{ name: `🎭 Rôles`, value: `${roleCount}`, inline: true },
				{ name: `😀 Emojis`, value: `${emojiCount}`, inline: true },
				{ name: '🚀 Niveau de Boost', value: `Niveau ${guild.premiumTier || '0'}`, inline: true }
			)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
