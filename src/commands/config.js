const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const db = require('../database');

// --- Panneaux de l'interface ---

async function buildMainMenu(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const welcomeStatus = settings.welcome_enabled ? '✅ Activé' : '❌ Désactivé';
	const logChannel = settings.log_channel_id ? `<#${settings.log_channel_id}>` : 'Non défini';
	const economyStatus = `💰 ${settings.economy_money_per_message}/msg | ✨ ${settings.economy_xp_per_message}/msg`;

	const embed = new EmbedBuilder()
		.setTitle(`Panneau de configuration de ${interaction.guild.name}`)
		.setDescription("Choisissez une catégorie à configurer à l'aide du menu déroulant ci-dessous.")
		.setColor(0x0099FF)
		.addFields(
			{ name: '👋 Système de Bienvenue', value: `**Statut :** ${welcomeStatus}` },
			{ name: '📝 Logs de Modération', value: `**Salon :** ${logChannel}` },
			{ name: '💰 Économie', value: `**Gains :** ${economyStatus}` }
		);

	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId('config_category_select')
		.setPlaceholder('Sélectionner une catégorie')
		.addOptions(
			{ label: 'Système de Bienvenue', value: 'welcome', emoji: '👋' },
			{ label: 'Logs de Modération', value: 'logs', emoji: '📝' },
			{ label: 'Économie', value: 'economy', emoji: '💰' }
		);

	const row = new ActionRowBuilder().addComponents(selectMenu);
	return { embeds: [embed], components: [row], ephemeral: true };
}

async function buildWelcomeMenu(interaction) {
	// ... (code existant, inchangé)
}

async function buildLogsMenu(interaction) {
	// ... (code existant, inchangé)
}

async function buildEconomyMenu(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	
	const embed = new EmbedBuilder()
		.setTitle('💰 Configuration de l\'Économie')
		.setColor(0xF1C40F)
		.addFields(
			{ name: 'Argent par message', value: `${settings.economy_money_per_message}`, inline: true },
			{ name: 'XP par message', value: `${settings.economy_xp_per_message}`, inline: true }
		);

	const editButton = new ButtonBuilder().setCustomId('economy_settings_modal').setLabel('Modifier les Gains').setStyle(ButtonStyle.Primary);
	const backButton = new ButtonBuilder().setCustomId('config_main_menu').setLabel('Retour').setStyle(ButtonStyle.Secondary);
	const row = new ActionRowBuilder().addComponents(editButton, backButton);

	return { embeds: [embed], components: [row], ephemeral: true };
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
		else if (category === 'economy') await interaction.update(await buildEconomyMenu(interaction));
	},
	
	async handleBack(interaction) {
		await interaction.update(await buildMainMenu(interaction));
	},
	
	// -- Welcome Handlers --
	// ... (code existant, inchangé)

	// -- Logs Handlers --
	// ... (code existant, inchangé)

	// -- Economy Handlers --
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
