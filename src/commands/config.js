const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const db = require('../database');
const { colors } = require('../utils/constants');

// --- Construction des Modals ---

async function buildWelcomeModal(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	
	const modal = new ModalBuilder()
		.setCustomId('config_welcome_modal')
		.setTitle('Configuration du module de bienvenue');

	const enabledInput = new TextInputBuilder()
		.setCustomId('welcome_enabled')
		.setLabel('Activer le module (oui/non)')
		.setStyle(TextInputStyle.Short)
		.setValue(settings.welcome_enabled ? 'oui' : 'non')
		.setRequired(true);

	const channelInput = new TextInputBuilder()
		.setCustomId('welcome_channel_id')
		.setLabel('ID du salon de bienvenue')
		.setStyle(TextInputStyle.Short)
		.setValue(settings.welcome_channel_id || '')
		.setPlaceholder('Ex: 123456789012345678')
		.setRequired(false);
	
	const messageInput = new TextInputBuilder()
		.setCustomId('welcome_message')
		.setLabel('Message de bienvenue')
		.setStyle(TextInputStyle.Paragraph)
		.setValue(settings.welcome_message || 'Bienvenue {user} sur {server} !')
		.setPlaceholder('Variables : {user}, {server}')
		.setRequired(false);

	modal.addComponents(
		new ActionRowBuilder().addComponents(enabledInput),
		new ActionRowBuilder().addComponents(channelInput),
		new ActionRowBuilder().addComponents(messageInput)
	);
	
	return modal;
}

async function buildLogsModal(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	
	const modal = new ModalBuilder()
		.setCustomId('config_logs_modal')
		.setTitle('Configuration du module de logs');

	const enabledInput = new TextInputBuilder()
		.setCustomId('log_enabled')
		.setLabel('Activer le module (oui/non)')
		.setStyle(TextInputStyle.Short)
		.setValue(settings.log_enabled ? 'oui' : 'non')
		.setRequired(true);

	const channelInput = new TextInputBuilder()
		.setCustomId('log_channel_id')
		.setLabel('ID du salon de logs')
		.setStyle(TextInputStyle.Short)
		.setValue(settings.log_channel_id || '')
		.setPlaceholder('Ex: 123456789012345678')
		.setRequired(false);

	modal.addComponents(
		new ActionRowBuilder().addComponents(enabledInput),
		new ActionRowBuilder().addComponents(channelInput)
	);
	
	return modal;
}

async function buildEconomyModal(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);

	const modal = new ModalBuilder()
		.setCustomId('config_economy_modal')
		.setTitle('Configuration du module d\'économie');
	
	const enabledInput = new TextInputBuilder()
		.setCustomId('economy_enabled')
		.setLabel('Activer le module (oui/non)')
		.setStyle(TextInputStyle.Short)
		.setValue(settings.economy_enabled ? 'oui' : 'non')
		.setRequired(true);
	
	const moneyPerMessageInput = new TextInputBuilder()
		.setCustomId('economy_money_per_message')
		.setLabel('Argent gagné par message')
		.setStyle(TextInputStyle.Short)
		.setValue(String(settings.economy_money_per_message))
		.setRequired(false);
		
	modal.addComponents(
		new ActionRowBuilder().addComponents(enabledInput),
		new ActionRowBuilder().addComponents(moneyPerMessageInput)
	);

	return modal;
}

// --- Commande et Export ---

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Ouvre le panneau de configuration interactif du bot.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand =>
			subcommand.setName('bienvenue').setDescription('Configure le système de messages de bienvenue.'))
		.addSubcommand(subcommand =>
			subcommand.setName('logs').setDescription('Configure le système de logs du serveur.'))
		.addSubcommand(subcommand =>
			subcommand.setName('economie').setDescription('Configure le système d\'économie.')),
	
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		
		if (subcommand === 'bienvenue') {
			const modal = await buildWelcomeModal(interaction);
			await interaction.showModal(modal);
		} else if (subcommand === 'logs') {
			const modal = await buildLogsModal(interaction);
			await interaction.showModal(modal);
		} else if (subcommand === 'economie') {
			const modal = await buildEconomyModal(interaction);
			await interaction.showModal(modal);
		}
	},

	// --- Logique de traitement des Modals ---

	async handleModalSubmit(interaction) {
		await interaction.deferReply({ ephemeral: true });
		
		const { customId, fields } = interaction;
		const guildId = interaction.guild.id;
		let newSettings = {};
		let feedbackMessage = '';

		try {
			if (customId === 'config_welcome_modal') {
				const welcome_enabled = fields.getTextInputValue('welcome_enabled').toLowerCase() === 'oui';
				const welcome_channel_id = fields.getTextInputValue('welcome_channel_id') || null;
				const welcome_message = fields.getTextInputValue('welcome_message') || 'Bienvenue {user} sur {server} !';
				
				newSettings = { welcome_enabled, welcome_channel_id, welcome_message };
				feedbackMessage = 'Les paramètres de bienvenue ont été mis à jour.';
			}
			else if (customId === 'config_logs_modal') {
				const log_enabled = fields.getTextInputValue('log_enabled').toLowerCase() === 'oui';
				const log_channel_id = fields.getTextInputValue('log_channel_id') || null;

				newSettings = { log_enabled, log_channel_id };
				feedbackMessage = 'Les paramètres de logs ont été mis à jour.';
			}
			else if (customId === 'config_economy_modal') {
				const economy_enabled = fields.getTextInputValue('economy_enabled').toLowerCase() === 'oui';
				const economy_money_per_message = parseFloat(fields.getTextInputValue('economy_money_per_message')) || 1;

				newSettings = { economy_enabled, economy_money_per_message };
				feedbackMessage = 'Les paramètres d\'économie ont été mis à jour.';
			}

			if (Object.keys(newSettings).length > 0) {
				await db.setGuildSettings(guildId, newSettings);
				await interaction.editReply({
					embeds: [new EmbedBuilder().setColor(colors.success).setDescription(`✅ ${feedbackMessage}`)]
				});
			} else {
				throw new Error('Modal non reconnu.');
			}
		} catch (error) {
			console.error("Erreur lors de la soumission du modal de configuration :", error);
			await interaction.editReply({
				embeds: [new EmbedBuilder().setColor(colors.danger).setDescription('❌ Une erreur est survenue.')]
			});
		}
	}
};

