const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Configure les paramètres du bot pour ce serveur.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommandGroup(group =>
			group
				.setName('bienvenue')
				.setDescription('Configure le système de messages de bienvenue.')
				.addSubcommand(subcommand =>
					subcommand
						.setName('activer')
						.setDescription('Active les messages de bienvenue.'))
				.addSubcommand(subcommand =>
					subcommand
						.setName('désactiver')
						.setDescription('Désactive les messages de bienvenue.'))
				.addSubcommand(subcommand =>
					subcommand
						.setName('salon')
						.setDescription('Définit le salon où envoyer les messages de bienvenue.')
						.addChannelOption(option =>
							option.setName('destination')
								.setDescription('Le salon à choisir.')
								.addChannelTypes(ChannelType.GuildText)
								.setRequired(true)))
				.addSubcommand(subcommand =>
					subcommand
						.setName('message')
						.setDescription('Personnalise le message de bienvenue.')
						.addStringOption(option =>
							option.setName('texte')
								.setDescription('Variables: {user}, {userName}, {server}, {memberCount}')
								.setRequired(true)))),
	async execute(interaction) {
		const group = interaction.options.getSubcommandGroup(false); // `false` pour ne pas throw une erreur si absent
		const guildId = interaction.guild.id;

		// Si aucune sous-commande n'est donnée, afficher le panneau de contrôle
		if (!group) {
			const settings = await db.getGuildSettings(guildId) || {};

			const status = settings.welcome_enabled ? '✅ Activé' : '❌ Désactivé';
			const channel = settings.welcome_channel_id ? `<#${settings.welcome_channel_id}>` : 'Non défini';
			const message = settings.welcome_message || 'Message par défaut.';

			const embed = new EmbedBuilder()
				.setTitle(`Panneau de configuration pour ${interaction.guild.name}`)
				.setDescription('Voici l\'état actuel des fonctionnalités. Utilisez les sous-commandes pour les modifier.')
				.setColor(0x0099FF)
				.addFields(
					{
						name: '👋 Système de Bienvenue',
						value: `**Statut :** ${status}\n**Salon :** ${channel}\n**Message :**\n>>> ${message}`
					}
				)
				.setFooter({ text: 'Exemple : /config bienvenue salon #général' });

			return interaction.reply({ embeds: [embed], ephemeral: true });
		}
		
		// Logique existante pour les sous-commandes
		const subcommand = interaction.options.getSubcommand();
		if (group === 'bienvenue') {
			if (subcommand === 'activer') {
				await db.setGuildSettings(guildId, { welcome_enabled: true });
				return interaction.reply({ content: '✅ Le système de bienvenue a été activé.', ephemeral: true });
			}
			
			if (subcommand === 'désactiver') {
				await db.setGuildSettings(guildId, { welcome_enabled: false });
				return interaction.reply({ content: '✅ Le système de bienvenue a été désactivé.', ephemeral: true });
			}

			if (subcommand === 'salon') {
				const channel = interaction.options.getChannel('destination');
				await db.setGuildSettings(guildId, { welcome_channel_id: channel.id });
				return interaction.reply({ content: `✅ Le salon de bienvenue a été défini sur ${channel}.`, ephemeral: true });
			}

			if (subcommand === 'message') {
				const message = interaction.options.getString('texte');
				await db.setGuildSettings(guildId, { welcome_message: message });
				return interaction.reply({ content: `✅ Le message de bienvenue a été mis à jour :\n>>> ${message}`, ephemeral: true });
			}
		}
	},
};
