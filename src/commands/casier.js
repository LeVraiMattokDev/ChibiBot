const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database');

const SANCTIONS_PER_PAGE = 5;

// --- Fonction pour construire l'embed et les boutons ---
async function buildCasierEmbed(interaction, page, targetUser = null) {
	const guildId = interaction.guild.id;
	const userId = targetUser ? targetUser.id : null;

	// Récupérer les données pour la page actuelle
	const totalSanctions = await db.countSanctions(guildId, userId);
	const totalPages = Math.ceil(totalSanctions / SANCTIONS_PER_PAGE);
	const sanctions = await db.getSanctionsPaginated(guildId, page, SANCTIONS_PER_PAGE, userId);

	// Construire l'embed
	const embed = new EmbedBuilder()
		.setColor(targetUser ? 0xFF0000 : 0x0099FF)
		.setTitle(targetUser ? `Casier judiciaire de ${targetUser.username}` : `Dernières sanctions du serveur`)
		.setFooter({ text: `Page ${page} sur ${totalPages} (${totalSanctions} sanctions au total)` });
	
	if (targetUser) {
		embed.setThumbnail(targetUser.displayAvatarURL());
	}

	if (sanctions.length === 0) {
		embed.setDescription('Aucune sanction à afficher.');
	} else {
		const fields = sanctions.map(s => {
			const duration = s.duration ? ` (${s.duration} min)` : '';
			const sanctionTitle = `ID: ${s.id} | ${s.type}${duration} | ${s.userName}`;
			
			if (s.revoked) {
				return {
					name: `~~${sanctionTitle}~~ (Révoquée)`,
					value: `Par ${s.moderatorName} - Le <t:${Math.floor(s.timestamp / 1000)}:d>\n> Raison : ${s.reason || 'Aucune'}\n> *Révoquée par ${s.revoked_by_name} pour : ${s.revoked_reason}*`
				};
			}
			return {
				name: sanctionTitle,
				value: `Par ${s.moderatorName} - Le <t:${Math.floor(s.timestamp / 1000)}:d>\n> Raison : ${s.reason || 'Aucune'}`
			};
		});
		embed.addFields(fields);
	}

	// Construire les boutons de navigation
	const prevButton = new ButtonBuilder()
		.setCustomId(`casier_prev_${page}_${userId || 'all'}`)
		.setLabel('Précédent')
		.setStyle(ButtonStyle.Primary)
		.setDisabled(page <= 1);

	const nextButton = new ButtonBuilder()
		.setCustomId(`casier_next_${page}_${userId || 'all'}`)
		.setLabel('Suivant')
		.setStyle(ButtonStyle.Primary)
		.setDisabled(page >= totalPages);

	const row = new ActionRowBuilder().addComponents(prevButton, nextButton);

	return { embeds: [embed], components: [row], ephemeral: true };
}


// --- Commande et Handlers ---
module.exports = {
	data: new SlashCommandBuilder()
		.setName('casier')
		.setDescription('Consulte l\'historique des sanctions.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addUserOption(option =>
			option.setName('utilisateur')
				.setDescription('L\'utilisateur à consulter (optionnel).')
				.setRequired(false)),

	async execute(interaction) {
		const targetUser = interaction.options.getUser('utilisateur');
		const casier = await buildCasierEmbed(interaction, 1, targetUser);
		await interaction.reply(casier);
	},

	// Handlers pour les boutons de pagination
	async handlePagination(interaction) {
		const [, direction, currentPageStr, userId] = interaction.customId.split('_');
		const currentPage = parseInt(currentPageStr, 10);
		const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;

		let targetUser = null;
		if (userId && userId !== 'all') {
			targetUser = await interaction.client.users.fetch(userId);
		}
		
		const updatedCasier = await buildCasierEmbed(interaction, newPage, targetUser);
		await interaction.update(updatedCasier);
	}
};
