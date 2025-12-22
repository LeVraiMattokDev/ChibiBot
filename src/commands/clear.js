const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Supprimer un nombre de messages.')
		.addIntegerOption(option =>
			option.setName('nombre')
				.setDescription('Le nombre de messages à supprimer (1-100)')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(100))
		.addUserOption(option =>
			option.setName('utilisateur')
				.setDescription('Supprimer les messages d\'un utilisateur spécifique'))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
		async execute(interaction) {
		const amount = interaction.options.getInteger('nombre');
		const user = interaction.options.getUser('utilisateur');

		await interaction.reply({ content: 'Suppression des messages en cours...', ephemeral: true, fetchReply: true });

		try {
			const messages = await interaction.channel.messages.fetch({ limit: 100 });
			let messagesToDelete;

			if (user) {
				messagesToDelete = messages.filter(m => m.author.id === user.id).first(amount);
			} else {
				messagesToDelete = messages.first(amount);
			}

			if (messagesToDelete.length === 0) {
				return interaction.editReply({ content: 'Aucun message à supprimer n\'a été trouvé avec les critères spécifiés.' });
			}

			// On ne peut pas bulkDelete un seul message, mais on peut le faire pour 0, donc on vérifie > 1
			if (messagesToDelete.length > 1) {
				const deletedMessages = await interaction.channel.bulkDelete(messagesToDelete, true);
				await interaction.editReply({ content: `✅ ${deletedMessages.size} message(s) ont été supprimés.` });
			} else {
				await messagesToDelete[0].delete();
				await interaction.editReply({ content: '✅ 1 message a été supprimé.' });
			}

		} catch (error) {
			console.error('Erreur dans la commande /clear :', error);
			await interaction.editReply({ content: '❌ Une erreur est survenue. Note : Les messages datant de plus de 14 jours ne peuvent pas être supprimés en masse.' });
		}
	},
};
