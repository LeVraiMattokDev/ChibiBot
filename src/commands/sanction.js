const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sanction')
		.setDescription('Gère les sanctions du serveur.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addSubcommand(subcommand =>
			subcommand
				.setName('révoquer')
				.setDescription('Révoque une sanction en utilisant son ID.')
				.addIntegerOption(option =>
					option.setName('id')
						.setDescription('L\'ID unique de la sanction (visible dans le /casier).')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('raison')
						.setDescription('La raison de la révocation.')
						.setRequired(true))),
	async execute(interaction) {
		if (interaction.options.getSubcommand() === 'révoquer') {
			const sanctionId = interaction.options.getInteger('id');
			const reason = interaction.options.getString('raison');
			const revoker = interaction.user;
			const guildId = interaction.guild.id;

			try {
				const affectedRows = await db.revokeSanction(sanctionId, guildId, revoker.id, revoker.tag, reason);

				if (affectedRows > 0) {
					await interaction.reply({
						content: `✅ La sanction avec l'ID **${sanctionId}** a été révoquée.`,
						ephemeral: true
					});
				} else {
					await interaction.reply({
						content: `❌ Aucune sanction trouvée avec l'ID **${sanctionId}** sur ce serveur, ou elle est déjà révoquée.`,
						ephemeral: true
					});
				}
			} catch (error) {
				console.error(error);
				await interaction.reply({
					content: '❌ Une erreur est survenue lors de la révocation de la sanction.',
					ephemeral: true
				});
			}
		}
	},
};
