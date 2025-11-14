const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const db = require('../database');

// --- Fonctions de construction des panneaux ---

async function buildMainMenu(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const s = (bool) => bool ? '✅ Activé' : '❌ Désactivé';

	const embed = new EmbedBuilder()
		.setTitle(`Panneau de configuration de ${interaction.guild.name}`)
		.setDescription("Choisissez une catégorie à configurer via le menu déroulant.")
		.setColor(0x0099FF)
		.addFields(
			{ name: '👋 Bienvenue', value: `**Statut :** ${s(settings.welcome_enabled)}`, inline: true },
			{ name: '📝 Logs', value: `**Statut :** ${s(settings.log_enabled)}`, inline: true },
			{ name: '💰 Économie (Argent)', value: `**Statut :** ${s(settings.economy_enabled)}`, inline: true },
			{ name: '✨ XP & Niveaux', value: `**Statut :** ${s(settings.xp_enabled)}`, inline: true },
			{ name: '🏪 Magasin', value: `**Statut :** ${s(settings.shop_enabled)}`, inline: true }
		);

	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId('config_category_select')
		.setPlaceholder('Sélectionner une catégorie')
		.addOptions(
			{ label: 'Bienvenue', value: 'welcome', emoji: '👋' },
			{ label: 'Logs', value: 'logs', emoji: '📝' },
			{ label: 'Économie', value: 'economy', emoji: '💰' },
			{ label: 'XP & Niveaux', value: 'xp', emoji: '✨' },
			{ label: 'Magasin', value: 'shop', emoji: '🏪' }
		);

	const row = new ActionRowBuilder().addComponents(selectMenu);
	return { embeds: [embed], components: [row], ephemeral: true };
}

async function buildFeatureMenu(interaction, type) {
	const settings = await db.getGuildSettings(interaction.guild.id); // Garanti de retourner un objet
	const s = (bool) => bool ? '✅ Activé' : '❌ Désactivé';
	let embed, components = [];

	const backButton = new ButtonBuilder().setCustomId('config_main_menu').setLabel('Retour').setStyle(ButtonStyle.Secondary);

	switch (type) {
		case 'welcome':
			embed = new EmbedBuilder().setTitle('👋 Config. Bienvenue').setColor(0x57F287)
				.addFields(
					{ name: 'Statut', value: s(settings.welcome_enabled) },
					{ name: 'Salon', value: settings.welcome_channel_id ? `<#${settings.welcome_channel_id}>` : 'Non défini' },
					{ name: 'Message', value: `>>> ${settings.welcome_message || 'Non défini'}` }
				);
			const welcomeToggle = new ButtonBuilder().setCustomId('config_toggle_welcome_enabled').setLabel(settings.welcome_enabled ? 'Désactiver' : 'Activer').setStyle(settings.welcome_enabled ? ButtonStyle.Danger : ButtonStyle.Success);
			const welcomeMsgBtn = new ButtonBuilder().setCustomId('welcome_message_modal').setLabel('Modifier Message').setStyle(ButtonStyle.Primary);
			const welcomeChanSelect = new StringSelectMenuBuilder().setCustomId('welcome_channel_select').setPlaceholder('Choisir un salon');
			interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText).first(25).forEach(c => welcomeChanSelect.addOptions({ label: c.name, value: c.id }));
			components.push(new ActionRowBuilder().addComponents(welcomeToggle, welcomeMsgBtn, backButton), new ActionRowBuilder().addComponents(welcomeChanSelect));
			break;
		
		case 'logs':
			embed = new EmbedBuilder().setTitle('📝 Config. Logs').setColor(0xFEE75C)
				.addFields(
					{ name: 'Statut', value: s(settings.log_enabled) },
					{ name: 'Salon', value: settings.log_channel_id ? `<#${settings.log_channel_id}>` : 'Non défini' }
				);
			const logsToggle = new ButtonBuilder().setCustomId('config_toggle_log_enabled').setLabel(settings.log_enabled ? 'Désactiver' : 'Activer').setStyle(settings.log_enabled ? ButtonStyle.Danger : ButtonStyle.Success);
			const logsChanSelect = new StringSelectMenuBuilder().setCustomId('logs_channel_select').setPlaceholder('Choisir un salon');
			interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText).first(25).forEach(c => logsChanSelect.addOptions({ label: c.name, value: c.id }));
			components.push(new ActionRowBuilder().addComponents(logsToggle, backButton), new ActionRowBuilder().addComponents(logsChanSelect));
			break;

		case 'economy':
			embed = new EmbedBuilder().setTitle('💰 Config. Économie').setColor(0xE67E22)
				.addFields(
					{ name: 'Statut', value: s(settings.economy_enabled) },
					{ name: 'Argent par message', value: String(settings.economy_money_per_message) }
				);
			const ecoToggle = new ButtonBuilder().setCustomId('config_toggle_economy_enabled').setLabel(settings.economy_enabled ? 'Désactiver' : 'Activer').setStyle(settings.economy_enabled ? ButtonStyle.Danger : ButtonStyle.Success);
			const ecoEditBtn = new ButtonBuilder().setCustomId('economy_settings_modal').setLabel('Modifier Gains').setStyle(ButtonStyle.Primary);
			components.push(new ActionRowBuilder().addComponents(ecoToggle, ecoEditBtn, backButton));
			break;

		case 'xp':
			embed = new EmbedBuilder().setTitle('✨ Config. XP & Niveaux').setColor(0x3498DB)
				.addFields(
					{ name: 'Statut', value: s(settings.xp_enabled) },
					{ name: 'XP par message', value: String(settings.economy_xp_per_message) }
				);
			const xpToggle = new ButtonBuilder().setCustomId('config_toggle_xp_enabled').setLabel(settings.xp_enabled ? 'Désactiver' : 'Activer').setStyle(settings.xp_enabled ? ButtonStyle.Danger : ButtonStyle.Success);
			const xpEditBtn = new ButtonBuilder().setCustomId('economy_settings_modal').setLabel('Modifier Gains').setStyle(ButtonStyle.Primary);
			components.push(new ActionRowBuilder().addComponents(xpToggle, xpEditBtn, backButton));
			break;
		
		case 'shop':
			embed = new EmbedBuilder().setTitle('🏪 Config. Magasin').setColor(0x95A5A6)
				.addFields({ name: 'Statut', value: s(settings.shop_enabled) })
				.setDescription('Le magasin utilise les commandes `/shop ajouter` et `/shop supprimer` pour la gestion des objets.');
			const shopToggle = new ButtonBuilder().setCustomId('config_toggle_shop_enabled').setLabel(settings.shop_enabled ? 'Désactiver' : 'Activer').setStyle(settings.shop_enabled ? ButtonStyle.Danger : ButtonStyle.Success);
			components.push(new ActionRowBuilder().addComponents(shopToggle, backButton));
			break;
	}

	return { embeds: [embed], components, ephemeral: true };
}


// --- Commande et Handlers ---

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Ouvre le panneau de configuration interactif du bot.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	
	async execute(interaction) {
		await interaction.reply(await buildMainMenu(interaction));
	},
	
	async handleCategorySelect(interaction) {
		await interaction.update(await buildFeatureMenu(interaction, interaction.values[0]));
	},
	
	async handleBack(interaction) {
		await interaction.update(await buildMainMenu(interaction));
	},

	async handleToggle(interaction, feature) {
		const settings = await db.getGuildSettings(interaction.guild.id);
		const currentValue = settings[feature];
		await db.setGuildSettings(interaction.guild.id, { [feature]: !currentValue });
		const category = interaction.customId.split('_')[2]; // ex: config_toggle_welcome_enabled -> welcome
		await interaction.update(await buildFeatureMenu(interaction, category));
	},

	async handleWelcomeChannel(interaction) {
		await db.setGuildSettings(interaction.guild.id, { welcome_channel_id: interaction.values[0] });
		await interaction.update(await buildFeatureMenu(interaction, 'welcome'));
	},
	
	async handleLogsChannel(interaction) {
		await db.setGuildSettings(interaction.guild.id, { log_channel_id: interaction.values[0] });
		await interaction.update(await buildFeatureMenu(interaction, 'logs'));
	},
	
	async handleWelcomeMessageModal(interaction) {
		const settings = await db.getGuildSettings(interaction.guild.id);
		const modal = new ModalBuilder().setCustomId('welcome_message_modal_submit').setTitle('Modifier le message de bienvenue');
		const messageInput = new TextInputBuilder().setCustomId('welcome_message_input').setLabel('Message').setStyle(TextInputStyle.Paragraph).setValue(settings.welcome_message || '');
		modal.addComponents(new ActionRowBuilder().addComponents(messageInput));
		await interaction.showModal(modal);
	},
	
	async handleWelcomeMessageSubmit(interaction) {
		const message = interaction.fields.getTextInputValue('welcome_message_input');
		await db.setGuildSettings(interaction.guild.id, { welcome_message: message });
		await interaction.reply({ content: '✅ Message de bienvenue mis à jour !', ephemeral: true });
	},

	async handleEconomySettingsModal(interaction) {
		const settings = await db.getGuildSettings(interaction.guild.id);
		const modal = new ModalBuilder().setCustomId('economy_settings_submit').setTitle('Modifier les Gains');
		const moneyInput = new TextInputBuilder().setCustomId('economy_money_input').setLabel('Argent gagné par message').setStyle(TextInputStyle.Short).setValue(String(settings.economy_money_per_message));
		const xpInput = new TextInputBuilder().setCustomId('economy_xp_input').setLabel('XP gagné par message').setStyle(TextInputStyle.Short).setValue(String(settings.economy_xp_per_message));
		modal.addComponents(new ActionRowBuilder().addComponents(moneyInput), new ActionRowBuilder().addComponents(xpInput));
		await interaction.showModal(modal);
	},

	async handleEconomySettingsSubmit(interaction) {
		const money = parseFloat(interaction.fields.getTextInputValue('economy_money_input'));
		const xp = parseInt(interaction.fields.getTextInputValue('economy_xp_input'), 10);
		if (isNaN(money) || isNaN(xp) || money < 0 || xp < 0) {
			return interaction.reply({ content: '❌ Veuillez entrer des nombres positifs valides.', ephemeral: true });
		}
		await db.setGuildSettings(interaction.guild.id, { economy_money_per_message: money, economy_xp_per_message: xp });
		await interaction.reply({ content: '✅ Paramètres de l\'économie mis à jour !', ephemeral: true });
	}
};
