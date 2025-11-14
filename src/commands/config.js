const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const db = require('../database');
const { colors } = require('../utils/constants');

// Charger dynamiquement tous les panneaux de configuration
const panels = new Map();
const panelsPath = path.join(__dirname, '../config-panels');
const panelFiles = fs.readdirSync(panelsPath).filter(file => file.endsWith('.js'));
for (const file of panelFiles) {
    const panel = require(path.join(panelsPath, file));
    panels.set(panel.name, panel);
}

// Fonction pour construire le menu principal
async function buildMainMenu(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const s = (bool) => bool ? '✅' : '❌';

	const embed = new EmbedBuilder()
		.setTitle(`Panneau de configuration de ${interaction.guild.name}`)
		.setDescription("Choisissez une catégorie à configurer via le menu déroulant.")
		.setColor(colors.primary)
		.addFields(
			{ name: '👋 Bienvenue', value: `Statut : ${s(settings.welcome_enabled)}`, inline: true },
			{ name: '📝 Logs', value: `Statut : ${s(settings.log_enabled)}`, inline: true },
			{ name: '💰 Économie', value: `Statut : ${s(settings.economy_enabled)}`, inline: true },
			{ name: '✨ XP & Niveaux', value: `Statut : ${s(settings.xp_enabled)}`, inline: true },
			{ name: '🏪 Magasin', value: `Statut : ${s(settings.shop_enabled)}`, inline: true }
		);

	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId('config_main_select')
		.setPlaceholder('Sélectionner une catégorie')
		.addOptions(Array.from(panels.values()).map(panel => ({
			label: panel.name.charAt(0).toUpperCase() + panel.name.slice(1),
			value: `config_${panel.name}_build`,
			emoji: { 'welcome': '👋', 'logs': '📝', 'economy': '💰', 'xp': '✨', 'shop': '🏪' }[panel.name]
		})));

	return { embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true };
}


// --- Commande et Export ---

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Ouvre le panneau de configuration interactif du bot.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	
	panels, // Exporte les panneaux chargés pour interactionCreate.js

	async execute(interaction) {
		await interaction.reply(await buildMainMenu(interaction));
	},
	
	async handleMainBuild(interaction) {
		return buildMainMenu(interaction);
	}
};
