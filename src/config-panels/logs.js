const { EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, ActionRowBuilder } = require('discord.js');
const db = require('../database');
const { colors } = require('../utils/constants');

async function buildLogsMenu(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const s = (bool) => bool ? '✅ Activé' : '❌ Désactivé';

	const embed = new EmbedBuilder().setTitle('📝 Config. Logs').setColor(colors.warning)
		.addFields({ name: 'Statut', value: s(settings.log_enabled) }, { name: 'Salon', value: settings.log_channel_id ? `<#${settings.log_channel_id}>` : 'Non défini' });

	const toggle = new ButtonBuilder().setCustomId('config_logs_toggle').setLabel(settings.log_enabled ? 'Désactiver' : 'Activer').setStyle(settings.log_enabled ? ButtonStyle.Danger : ButtonStyle.Success);
	const backBtn = new ButtonBuilder().setCustomId('config_main').setLabel('Retour').setStyle(ButtonStyle.Secondary);
	
	const chanSelect = new StringSelectMenuBuilder().setCustomId('config_logs_channel').setPlaceholder('Choisir un salon');
	interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText).first(25).forEach(c => chanSelect.addOptions({ label: c.name, value: c.id }));
	
	const row1 = new ActionRowBuilder().addComponents(toggle, backBtn);
	const row2 = new ActionRowBuilder().addComponents(chanSelect);

	return { embeds: [embed], components: [row1, row2], ephemeral: true };
}

async function handleLogsToggle(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	await db.setGuildSettings(interaction.guild.id, { log_enabled: !settings.log_enabled });
	return buildLogsMenu(interaction);
}

async function handleLogsChannel(interaction) {
	await db.setGuildSettings(interaction.guild.id, { log_channel_id: interaction.values[0] });
	return buildLogsMenu(interaction);
}

module.exports = {
	name: 'logs',
	build: buildLogsMenu,
	handlers: {
		toggle: handleLogsToggle,
		channel: handleLogsChannel,
	}
};
