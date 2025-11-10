const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('casier')
		.setDescription('Consulte l\'historique des sanctions.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addSubcommand(subcommand =>
			subcommand
				.setName('voir')
				.setDescription('Voir le casier judiciaire d\'un utilisateur.')
				.addUserOption(option => option.setName('utilisateur').setDescription('L\'utilisateur à consulter').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('recentes')
				.setDescription('Voir les dernières sanctions du serveur.')),
	async execute(interaction) {
		if (interaction.options.getSubcommand() === 'voir') {
			const user = interaction.options.getUser('utilisateur');
			const history = db.getUserHistory(user.id);

			const embed = new EmbedBuilder()
				.setColor(0xFF0000)
				.setTitle(`Casier judiciaire de ${user.username}`)
				.setThumbnail(user.displayAvatarURL());

			if (history.length === 0) {
				embed.setDescription('Cet utilisateur n\'a aucune sanction enregistrée.');
			} else {
				const fields = history.map(s => {
					const duration = s.duration ? ` (${s.duration} min)` : '';
					return {
						name: `ID: ${s.id} | ${s.type}${duration}`,
						value: `**Modérateur :** ${s.moderatorName}\n**Raison :** ${s.reason || 'Aucune'}\n<t:${Math.floor(s.timestamp / 1000)}:f>`
					};
				});
				embed.addFields(fields.slice(0, 25)); // Limite de 25 champs par embed
			}
			await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

		} else if (interaction.options.getSubcommand() === 'recentes') {
			const recentHistory = db.getRecentHistory();

			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle('Dernières sanctions du serveur');

			if (recentHistory.length === 0) {
				embed.setDescription('Aucune sanction récente trouvée.');
			} else {
				const description = recentHistory.map(s => {
					return `**Utilisateur :** ${s.userName} | **Type :** ${s.type}\n**Modo :** ${s.moderatorName} | <t:${Math.floor(s.timestamp / 1000)}:R>`;
				}).join('\\n\\n');
				embed.setDescription(description);
			}
			await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		}
	},
};
