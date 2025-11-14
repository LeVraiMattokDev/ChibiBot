const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const db = require('../database');
const { colors } = require('../utils/constants');

async function build(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const s = (bool) => bool ? '✅ Activé' : '❌ Désactivé';

	const embed = new EmbedBuilder().setTitle('💰 Config. Économie').setColor(0xE67E22)
		.addFields({ name: 'Statut', value: s(settings.economy_enabled) }, { name: 'Argent par message', value: `${settings.economy_money_per_message}` });
	
	const toggle = new ButtonBuilder().setCustomId('config_economy_toggle').setLabel(settings.economy_enabled ? 'Désactiver' : 'Activer').setStyle(settings.economy_enabled ? ButtonStyle.Danger : ButtonStyle.Success);
	const editBtn = new ButtonBuilder().setCustomId('config_economy_edit').setLabel('Modifier Gains').setStyle(ButtonStyle.Primary);
	const backBtn = new ButtonBuilder().setCustomId('config_main_build').setLabel('Retour').setStyle(ButtonStyle.Secondary);

	return { embeds: [embed], components: [new ActionRowBuilder().addComponents(toggle, editBtn, backBtn)], ephemeral: true };
}

async function handleToggle(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	await db.setGuildSettings(interaction.guild.id, { economy_enabled: !settings.economy_enabled });
	return build(interaction);
}

async function handleEdit(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const modal = new ModalBuilder().setCustomId('config_economy_submit').setTitle('Modifier les Gains');
	const moneyInput = new TextInputBuilder().setCustomId('money_input').setLabel('Argent gagné par message').setStyle(TextInputStyle.Short).setValue(String(settings.economy_money_per_message));
	modal.addComponents(new ActionRowBuilder().addComponents(moneyInput));
	await interaction.showModal(modal);
}

async function handleSubmit(interaction) {
	const money = parseFloat(interaction.fields.getTextInputValue('money_input'));
	if (isNaN(money) || money < 0) return interaction.reply({ content: '❌ Veuillez entrer un nombre positif valide.', ephemeral: true });
	await db.setGuildSettings(interaction.guild.id, { economy_money_per_message: money });
	await interaction.reply({ content: '✅ Paramètres mis à jour !', ephemeral: true });
}

module.exports = {
	name: 'economy',
	build: build,
	handlers: {
		toggle: handleToggle,
		edit: handleEdit,
		submit: handleSubmit,
	}
};
