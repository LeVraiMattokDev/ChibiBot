const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../database');
const { logSanction } = require('../utils/logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('timeout')
		.setDescription('Rendre un utilisateur silencieux.')
				.addMemberOption(option =>
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
		const member = interaction.options.getMember('utilisateur');
		const durationMinutes = interaction.options.getInteger('duree');
		const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';

		if (!member) {
			return interaction.reply({ content: "Cet utilisateur n'est pas sur le serveur.", flags: MessageFlags.Ephemeral });
		}
		if (member.id === interaction.user.id) {
			return interaction.reply({ content: "Vous ne pouvez pas vous rendre silencieux vous-même !", flags: MessageFlags.Ephemeral });
		}
		if (member.id === interaction.client.user.id) {
			return interaction.reply({ content: "Je ne peux pas me rendre silencieux moi-même !", flags: MessageFlags.Ephemeral });
		}
		if (!member.moderatable) {
			return interaction.reply({ content: "Je n'ai pas les permissions nécessaires pour rendre cet utilisateur silencieux. Mon rôle est peut-être trop bas ou l'utilisateur est administrateur.", flags: MessageFlags.Ephemeral });
		}

		const durationMs = durationMinutes * 60 * 1000;

		try {
			await member.timeout(durationMs, reason);
			await db.addSanction(interaction.guild.id, member.id, member.user.tag, interaction.user.id, interaction.user.tag, 'TIMEOUT', reason, durationMs);
			await interaction.reply(`**${member.user.tag}** a été rendu silencieux pour **${durationMinutes}** minute(s). Raison : **${reason}**`);

			await logSanction(interaction, 'TIMEOUT', member.user, reason, `${durationMinutes} minute(s)`);

		} catch (error) {
			console.error(error);
			await interaction.reply({ content: `Je n'ai pas pu rendre **${member.user.tag}** silencieux.`, flags: MessageFlags.Ephemeral });
		}
	},
};

