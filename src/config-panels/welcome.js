const { EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const db = require('../database');
const { colors } = require('../utils/constants');

async function build(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const s = (bool) => bool ? '✅ Activé' : '❌ Désactivé';

	const embed = new EmbedBuilder().setTitle('👋 Config. Bienvenue').setColor(colors.success)
		.addFields(
			{ name: 'Statut', value: s(settings.welcome_enabled) },
			{ name: 'Salon', value: settings.welcome_channel_id ? `<#${settings.welcome_channel_id}>` : 'Non défini' },
			{ name: 'Message', value: `>>> ${settings.welcome_message || 'Non défini'}` }
		);

	const toggle = new ButtonBuilder().setCustomId('config_welcome_toggle').setLabel(settings.welcome_enabled ? 'Désactiver' : 'Activer').setStyle(settings.welcome_enabled ? ButtonStyle.Danger : ButtonStyle.Success);
	const msgBtn = new ButtonBuilder().setCustomId('config_welcome_message').setLabel('Modifier Message').setStyle(ButtonStyle.Primary);
	const backBtn = new ButtonBuilder().setCustomId('config_main_build').setLabel('Retour').setStyle(ButtonStyle.Secondary);
	
	const chanSelect = new StringSelectMenuBuilder().setCustomId('config_welcome_channel').setPlaceholder('Choisir un salon');
	interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText).first(25).forEach(c => chanSelect.addOptions({ label: c.name, value: c.id }));

	return { embeds: [embed], components: [new ActionRowBuilder().addComponents(toggle, msgBtn, backBtn), new ActionRowBuilder().addComponents(chanSelect)], ephemeral: true };
}

async function handleToggle(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	await db.setGuildSettings(interaction.guild.id, { welcome_enabled: !settings.welcome_enabled });
	return build(interaction);
}

async function handleChannel(interaction) {
	await db.setGuildSettings(interaction.guild.id, { welcome_channel_id: interaction.values[0] });
	return build(interaction);
}

async function handleMessage(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const modal = new ModalBuilder().setCustomId('config_welcome_messageSubmit').setTitle('Modifier le message de bienvenue');
	const input = new TextInputBuilder().setCustomId('message_input').setLabel('Message').setStyle(TextInputStyle.Paragraph).setValue(settings.welcome_message || '');
	modal.addComponents(new ActionRowBuilder().addComponents(input));
	await interaction.showModal(modal);
}

async function handleMessageSubmit(interaction) {
	const message = interaction.fields.getTextInputValue('message_input');
	await db.setGuildSettings(interaction.guild.id, { welcome_message: message });
	await interaction.reply({ content: '✅ Message mis à jour !', ephemeral: true });
}

module.exports = {
	name: 'welcome',
	build: build,
	handlers: {
		toggle: handleToggle,
		channel: handleChannel,
		message: handleMessage,
		messageSubmit: handleMessageSubmit,
	}
};
