// Similaire à economy.js, mais pour l'XP
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const db = require('../database');
const { colors } = require('../utils/constants');

async function buildXpMenu(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const s = (bool) => bool ? '✅ Activé' : '❌ Désactivé';

	const embed = new EmbedBuilder().setTitle('✨ Config. XP & Niveaux').setColor(colors.info)
		.addFields({ name: 'Statut', value: s(settings.xp_enabled) }, { name: 'XP par message', value: `${settings.economy_xp_per_message}` });
	
	const toggle = new ButtonBuilder().setCustomId('config_xp_toggle').setLabel(settings.xp_enabled ? 'Désactiver' : 'Activer').setStyle(settings.xp_enabled ? ButtonStyle.Danger : ButtonStyle.Success);
	const editBtn = new ButtonBuilder().setCustomId('config_xp_edit').setLabel('Modifier Gains').setStyle(ButtonStyle.Primary);
	const backBtn = new ButtonBuilder().setCustomId('config_main').setLabel('Retour').setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder().addComponents(toggle, editBtn, backBtn);
	return { embeds: [embed], components: [row], ephemeral: true };
}

async function handleXpToggle(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	await db.setGuildSettings(interaction.guild.id, { xp_enabled: !settings.xp_enabled });
	return buildXpMenu(interaction);
}

async function handleXpModal(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const modal = new ModalBuilder().setCustomId('config_xp_submit').setTitle('Modifier les Gains');
	const xpInput = new TextInputBuilder().setCustomId('xp_input').setLabel('XP gagné par message').setStyle(TextInputStyle.Short).setValue(String(settings.economy_xp_per_message));
	modal.addComponents(new ActionRowBuilder().addComponents(xpInput));
	await interaction.showModal(modal);
}

async function handleXpSubmit(interaction) {
	const xp = parseInt(interaction.fields.getTextInputValue('xp_input'), 10);
	if (isNaN(xp) || xp < 0) return interaction.reply({ content: '❌ Veuillez entrer un nombre entier positif valide.', ephemeral: true });
	await db.setGuildSettings(interaction.guild.id, { economy_xp_per_message: xp });
	await interaction.reply({ content: '✅ Paramètres mis à jour !', ephemeral: true });
}

module.exports = {
	name: 'xp',
	build: buildXpMenu,
	handlers: {
		toggle: handleXpToggle,
		edit: handleXpModal,
		submit: handleXpSubmit,
	}
};
