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

		await interaction.deferReply({ ephemeral: true });

		if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageMessages)) {
			return interaction.editReply({ content: 'Je n\'ai pas la permission de supprimer des messages dans ce salon.' });
		}

		try {
			let messagesToDelete;
			if (user) {
				const allMessages = await interaction.channel.messages.fetch({ limit: 100 });
				messagesToDelete = allMessages.filter(m => m.author.id === user.id).first(amount);
			} else {
				messagesToDelete = amount;
			}
			
			if (messagesToDelete.length === 0) {
				return interaction.editReply({ content: 'Aucun message à supprimer trouvé pour cet utilisateur dans les 100 derniers messages.' });
			}

			const deletedMessages = await interaction.channel.bulkDelete(messagesToDelete, true);
			
			if (user) {
				await interaction.editReply({ content: `✅ ${deletedMessages.size} message(s) de **${user.tag}** ont été supprimés.` });
			} else {
				await interaction.editReply({ content: `✅ ${deletedMessages.size} message(s) ont été supprimés.` });
			}

		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: '❌ Une erreur est survenue. Je ne peux pas supprimer les messages datant de plus de 14 jours.' });
		}
	},
};
