const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inventaire')
		.setDescription('Affiche les objets que vous possédez.')
		.addUserOption(option =>
			option.setName('utilisateur')
				.setDescription('L\'utilisateur dont vous voulez voir l\'inventaire (admins seulement).')
				.setRequired(false)),
	async execute(interaction) {
		const targetUser = interaction.options.getUser('utilisateur') || interaction.user;

		if (targetUser.id !== interaction.user.id && !interaction.member.permissions.has('Administrator')) {
			return interaction.reply({ content: '❌ Vous ne pouvez voir que votre propre inventaire.', ephemeral: true });
		}

		await interaction.deferReply();

		const inventory = await db.getUserInventory(interaction.guild.id, targetUser.id);

		const embed = new EmbedBuilder()
			.setTitle(`Inventaire de ${targetUser.username}`)
			.setColor(0x95A5A6);

		if (inventory.length === 0) {
			embed.setDescription('Cet inventaire est vide.');
		} else {
			inventory.forEach(item => {
				embed.addFields({
					name: `${item.name} (x${item.quantity})`,
					value: item.description || 'Aucune description.',
				});
			});
		}

		await interaction.editReply({ embeds: [embed] });
	},
};
