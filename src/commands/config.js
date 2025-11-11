const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const db = require('../database');

// --- Fonctions d'aide pour construire les messages ---

// Construit le panneau principal de configuration
async function buildMainMenu(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id) || {};
	const status = settings.welcome_enabled ? '✅ Activé' : '❌ Désactivé';

	const embed = new EmbedBuilder()
		.setTitle(`Panneau de configuration de ${interaction.guild.name}`)
		.setDescription('Choisissez une catégorie à configurer à l\'aide du menu déroulant ci-dessous.')
		.setColor(0x0099FF)
		.addFields({ name: '👋 Système de Bienvenue', value: `**Statut :** ${status}` });

	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId('config_category_select')
		.setPlaceholder('Sélectionner une catégorie')
		.addOptions({
			label: 'Système de Bienvenue',
			description: 'Configure les messages pour les nouveaux membres.',
			value: 'welcome',
			emoji: '👋',
		});

	const row = new ActionRowBuilder().addComponents(selectMenu);
	return { embeds: [embed], components: [row], ephemeral: true };
}

// Construit le sous-panneau pour le système de bienvenue
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

	const toggleButton = new ButtonBuilder()
		.setCustomId('welcome_toggle')
		.setLabel(settings.welcome_enabled ? 'Désactiver' : 'Activer')
		.setStyle(settings.welcome_enabled ? ButtonStyle.Danger : ButtonStyle.Success);

	const messageButton = new ButtonBuilder()
		.setCustomId('welcome_message_modal')
		.setLabel('Modifier le Message')
		.setStyle(ButtonStyle.Primary);
		
	const channelSelect = new StringSelectMenuBuilder()
		.setCustomId('welcome_channel_select')
		.setPlaceholder('Choisir un nouveau salon')
		.addOptions([{ label: 'Désactiver le salon', value: 'disable' }]); // Option pour désactiver
		
	const backButton = new ButtonBuilder()
		.setCustomId('config_main_menu')
		.setLabel('Retour')
		.setStyle(ButtonStyle.Secondary);

	// Pourrait être amélioré pour gérer dynamiquement les salons
	interaction.guild.channels.cache
		.filter(c => c.type === ChannelType.GuildText)
		.first(24) // Limite de 25 options
		.forEach(c => channelSelect.addOptions({ label: c.name, value: c.id }));

	const row1 = new ActionRowBuilder().addComponents(toggleButton, messageButton, backButton);
	const row2 = new ActionRowBuilder().addComponents(channelSelect);
	
	return { embeds: [embed], components: [row1, row2], ephemeral: true };
}

// --- Commande principale et export des handlers ---

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Ouvre le panneau de configuration interactif du bot.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	
	// Exécution de la commande /config
	async execute(interaction) {
		const mainMenu = await buildMainMenu(interaction);
		await interaction.reply(mainMenu);
	},
	
	// Handlers pour les interactions de composants (appelés depuis interactionCreate.js)
	
	// Menu principal
	async handleCategorySelect(interaction) {
		if (interaction.values[0] === 'welcome') {
			const welcomeMenu = await buildWelcomeMenu(interaction);
			await interaction.update(welcomeMenu);
		}
	},
	
	// Bouton Retour
	async handleBack(interaction) {
		const mainMenu = await buildMainMenu(interaction);
		await interaction.update(mainMenu);
	},
	
	// Boutons du panneau Bienvenue
	async handleWelcomeToggle(interaction) {
		const settings = await db.getGuildSettings(interaction.guild.id) || {};
		await db.setGuildSettings(interaction.guild.id, { welcome_enabled: !settings.welcome_enabled });
		const updatedMenu = await buildWelcomeMenu(interaction);
		await interaction.update(updatedMenu);
	},

	async handleWelcomeChannel(interaction) {
		const channelId = interaction.values[0] === 'disable' ? null : interaction.values[0];
		await db.setGuildSettings(interaction.guild.id, { welcome_channel_id: channelId });
		const updatedMenu = await buildWelcomeMenu(interaction);
		await interaction.update(updatedMenu);
	},
	
	// Ouvre le popup (modal)
	async handleWelcomeMessageModal(interaction) {
		const settings = await db.getGuildSettings(interaction.guild.id) || {};
		const currentMessage = settings.welcome_message || 'Bienvenue {user} !';

		const modal = new ModalBuilder()
			.setCustomId('welcome_message_modal_submit')
			.setTitle('Modifier le message de bienvenue');
			
		const messageInput = new TextInputBuilder()
			.setCustomId('welcome_message_input')
			.setLabel('Message (Variables: {user}, {server}, etc.)')
			.setStyle(TextInputStyle.Paragraph)
			.setValue(currentMessage);
			
		modal.addComponents(new ActionRowBuilder().addComponents(messageInput));
		await interaction.showModal(modal);
	},
	
	// Gère la soumission du popup (modal)
	async handleWelcomeMessageSubmit(interaction) {
		const message = interaction.fields.getTextInputValue('welcome_message_input');
		await db.setGuildSettings(interaction.guild.id, { welcome_message: message });
		await interaction.reply({ content: '✅ Message de bienvenue mis à jour ! Le panneau va se rafraîchir.', ephemeral: true });
		// On ne peut pas faire un update directement ici, l'utilisateur verra la confirmation et le panneau se mettra à jour à la prochaine interaction.
	}
};
