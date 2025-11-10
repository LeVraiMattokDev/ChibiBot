const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('timeout')
		.setDescription('Rendre un utilisateur silencieux.')
		.addUserOption(option =>
			option.setName('utilisateur')
				.setDescription('L\'utilisateur à timeout')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('duree')
				.setDescription('Durée en minutes (1-40320)')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(40320)) // 28 jours
		.addStringOption(option =>
			option.setName('raison')
				.setDescription('La raison du timeout'))
		.setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
	async execute(interaction) {
		const user = interaction.options.getUser('utilisateur');
		const duration = interaction.options.getInteger('duree');
		const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';
		const member = await interaction.guild.members.fetch(user.id);

		if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.MuteMembers)) {
			return interaction.reply({ content: 'Je n\'ai pas la permission de rendre des membres silencieux.', flags: MessageFlags.Ephemeral });
		}

		try {
			await member.timeout(duration * 60 * 1000, reason);
			db.addSanction(user.id, user.tag, interaction.user.id, interaction.user.tag, 'TIMEOUT', reason, duration);
			await interaction.reply(`**${user.tag}** a été rendu silencieux pour **${duration}** minute(s). Raison : **${reason}**`);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: `Je n'ai pas pu rendre **${user.tag}** silencieux. Vérifiez ma hiérarchie de rôles.`, flags: MessageFlags.Ephemeral });
		}
	},
};
