const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const db = require('../database');

// --- Panneaux de l'interface ---

async function buildMainMenu(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id) || {};
	const welcomeStatus = settings.welcome_enabled ? '✅ Activé' : '❌ Désactivé';
	const logChannel = settings.log_channel_id ? `<#${settings.log_channel_id}>` : 'Non défini';

	const embed = new EmbedBuilder()
		.setTitle(`Panneau de configuration de ${interaction.guild.name}`)
		.setDescription("Choisissez une catégorie à configurer à l'aide du menu déroulant ci-dessous.")
		.setColor(0x0099FF)
		.addFields(
			{ name: '👋 Système de Bienvenue', value: `**Statut :** ${welcomeStatus}` },
			{ name: '📝 Logs de Modération', value: `**Salon :** ${logChannel}` }
		);

	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId('config_category_select')
		.setPlaceholder('Sélectionner une catégorie')
		.addOptions(
			{ label: 'Système de Bienvenue', description: 'Configure les messages pour les nouveaux membres.', value: 'welcome', emoji: '👋' },
			{ label: 'Logs de Modération', description: 'Configure le salon où envoyer les logs d\'activité.', value: 'logs', emoji: '📝' }
		);

	const row = new ActionRowBuilder().addComponents(selectMenu);
	return { embeds: [embed], components: [row], ephemeral: true };
}

async function buildWelcomeMenu(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id) || {};
	const status = settings.welcome_enabled ? '✅ Activé' : '❌ Désactivé';
	const channel = settings.welcome_channel_id ? `<#${settings.welcome_channel_id}>` : 'Non défini';
	const message = settings.welcome_message || 'Message par défaut.';

	const embed = new EmbedBuilder()
		.setTitle('👋 Configuration du Système de Bienvenue')
		.setColor(0x57F287)
		.addFields(
			{ name: 'Statut', value: status, inline: true },
			{ name: 'Salon', value: channel, inline: true },
			{ name: 'Message Actuel', value: `>>> ${message}` }
		);

	const toggleButton = new ButtonBuilder().setCustomId('welcome_toggle').setLabel(settings.welcome_enabled ? 'Désactiver' : 'Activer').setStyle(settings.welcome_enabled ? ButtonStyle.Danger : ButtonStyle.Success);
	const messageButton = new ButtonBuilder().setCustomId('welcome_message_modal').setLabel('Modifier le Message').setStyle(ButtonStyle.Primary);
	const backButton = new ButtonBuilder().setCustomId('config_main_menu').setLabel('Retour').setStyle(ButtonStyle.Secondary);
	
	const channelSelect = new StringSelectMenuBuilder().setCustomId('welcome_channel_select').setPlaceholder('Choisir un nouveau salon');
	interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText).first(25).forEach(c => channelSelect.addOptions({ label: c.name, value: c.id }));

	const row1 = new ActionRowBuilder().addComponents(toggleButton, messageButton, backButton);
	const row2 = new ActionRowBuilder().addComponents(channelSelect);
	
	return { embeds: [embed], components: [row1, row2], ephemeral: true };
}

async function buildLogsMenu(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id) || {};
	const channel = settings.log_channel_id ? `<#${settings.log_channel_id}>` : 'Non défini';

	const embed = new EmbedBuilder()
		.setTitle('📝 Configuration des Logs')
		.setColor(0xFEE75C)
		.addFields({ name: 'Salon Actuel', value: channel });

	const channelSelect = new StringSelectMenuBuilder().setCustomId('logs_channel_select').setPlaceholder('Choisir un nouveau salon de logs');
	interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText).first(25).forEach(c => channelSelect.addOptions({ label: c.name, value: c.id }));
	
	const backButton = new ButtonBuilder().setCustomId('config_main_menu').setLabel('Retour').setStyle(ButtonStyle.Secondary);

	const row1 = new ActionRowBuilder().addComponents(channelSelect);
	const row2 = new ActionRowBuilder().addComponents(backButton);
	
	return { embeds: [embed], components: [row1, row2], ephemeral: true };
}

// --- Commande et Handlers ---

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Ouvre le panneau de configuration interactif du bot.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	
	async execute(interaction) {
		const mainMenu = await buildMainMenu(interaction);
		await interaction.reply(mainMenu);
	},
	
	// -- Dispatchers --
	async handleCategorySelect(interaction) {
		const category = interaction.values[0];
		if (category === 'welcome') await interaction.update(await buildWelcomeMenu(interaction));
		else if (category === 'logs') await interaction.update(await buildLogsMenu(interaction));
	},
	
	async handleBack(interaction) {
		await interaction.update(await buildMainMenu(interaction));
	},
	
	// -- Welcome Handlers --
	async handleWelcomeToggle(interaction) {
		const settings = await db.getGuildSettings(interaction.guild.id) || {};
		await db.setGuildSettings(interaction.guild.id, { welcome_enabled: !settings.welcome_enabled });
		await interaction.update(await buildWelcomeMenu(interaction));
	},

	async handleWelcomeChannel(interaction) {
		await db.setGuildSettings(interaction.guild.id, { welcome_channel_id: interaction.values[0] });
		await interaction.update(await buildWelcomeMenu(interaction));
	},
	
	async handleWelcomeMessageModal(interaction) {
		const settings = await db.getGuildSettings(interaction.guild.id) || {};
		const currentMessage = settings.welcome_message || 'Bienvenue {user} !';
		const modal = new ModalBuilder().setCustomId('welcome_message_modal_submit').setTitle('Modifier le message de bienvenue');
		const messageInput = new TextInputBuilder().setCustomId('welcome_message_input').setLabel('Message (Variables: {user}, {server}, etc.)').setStyle(TextInputStyle.Paragraph).setValue(currentMessage);
		modal.addComponents(new ActionRowBuilder().addComponents(messageInput));
		await interaction.showModal(modal);
	},
	
	async handleWelcomeMessageSubmit(interaction) {
		const message = interaction.fields.getTextInputValue('welcome_message_input');
		await db.setGuildSettings(interaction.guild.id, { welcome_message: message });
		await interaction.reply({ content: '✅ Message de bienvenue mis à jour !', ephemeral: true });
	},

	// -- Logs Handlers --
	async handleLogsChannel(interaction) {
		await db.setGuildSettings(interaction.guild.id, { log_channel_id: interaction.values[0] });
		await interaction.update(await buildLogsMenu(interaction));
	}
};
