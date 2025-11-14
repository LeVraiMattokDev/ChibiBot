const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const db = require('../database');
const { colors } = require('../utils/constants');

async function buildEconomyMenu(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const s = (bool) => bool ? '✅ Activé' : '❌ Désactivé';

	const embed = new EmbedBuilder().setTitle('💰 Config. Économie').setColor(0xE67E22)
		.addFields({ name: 'Statut', value: s(settings.economy_enabled) }, { name: 'Argent par message', value: `${settings.economy_money_per_message}` });
	
	const toggle = new ButtonBuilder().setCustomId('config_economy_toggle').setLabel(settings.economy_enabled ? 'Désactiver' : 'Activer').setStyle(settings.economy_enabled ? ButtonStyle.Danger : ButtonStyle.Success);
	const editBtn = new ButtonBuilder().setCustomId('config_economy_edit').setLabel('Modifier Gains').setStyle(ButtonStyle.Primary);
	const backBtn = new ButtonBuilder().setCustomId('config_main').setLabel('Retour').setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder().addComponents(toggle, editBtn, backBtn);
	return { embeds: [embed], components: [row], ephemeral: true };
}

async function handleEconomyToggle(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	await db.setGuildSettings(interaction.guild.id, { economy_enabled: !settings.economy_enabled });
	return buildEconomyMenu(interaction);
}

async function handleEconomyModal(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const modal = new ModalBuilder().setCustomId('config_economy_submit').setTitle('Modifier les Gains');
	const moneyInput = new TextInputBuilder().setCustomId('money_input').setLabel('Argent gagné par message').setStyle(TextInputStyle.Short).setValue(String(settings.economy_money_per_message));
	modal.addComponents(new ActionRowBuilder().addComponents(moneyInput));
	await interaction.showModal(modal);
}

async function handleEconomySubmit(interaction) {
	const money = parseFloat(interaction.fields.getTextInputValue('money_input'));
	if (isNaN(money) || money < 0) return interaction.reply({ content: '❌ Veuillez entrer un nombre positif valide.', ephemeral: true });
	await db.setGuildSettings(interaction.guild.id, { economy_money_per_message: money });
	await interaction.reply({ content: '✅ Paramètres mis à jour !', ephemeral: true });
}

module.exports = {
	name: 'economy',
	build: buildEconomyMenu,
	handlers: {
		toggle: handleEconomyToggle,
		edit: handleEconomyModal,
		submit: handleEconomySubmit,
	}
};
