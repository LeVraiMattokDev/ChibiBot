const { EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, ActionRowBuilder } = require('discord.js');
const db = require('../database');
const { colors } = require('../utils/constants');

async function build(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const s = (bool) => bool ? '✅ Activé' : '❌ Désactivé';

	const embed = new EmbedBuilder().setTitle('📝 Config. Logs').setColor(colors.warning)
		.addFields({ name: 'Statut', value: s(settings.log_enabled) }, { name: 'Salon', value: settings.log_channel_id ? `<#${settings.log_channel_id}>` : 'Non défini' });

	const toggle = new ButtonBuilder().setCustomId('config_logs_toggle').setLabel(settings.log_enabled ? 'Désactiver' : 'Activer').setStyle(settings.log_enabled ? ButtonStyle.Danger : ButtonStyle.Success);
	const backBtn = new ButtonBuilder().setCustomId('config_main_build').setLabel('Retour').setStyle(ButtonStyle.Secondary);
	
	const chanSelect = new StringSelectMenuBuilder().setCustomId('config_logs_channel').setPlaceholder('Choisir un salon');
	interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText).first(25).forEach(c => chanSelect.addOptions({ label: c.name, value: c.id }));
	
	return { embeds: [embed], components: [new ActionRowBuilder().addComponents(toggle, backBtn), new ActionRowBuilder().addComponents(chanSelect)], ephemeral: true };
}

async function handleToggle(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	await db.setGuildSettings(interaction.guild.id, { log_enabled: !settings.log_enabled });
	return build(interaction);
}

async function handleChannel(interaction) {
	await db.setGuildSettings(interaction.guild.id, { log_channel_id: interaction.values[0] });
	return build(interaction);
}

module.exports = {
	name: 'logs',
	build: build,
	handlers: {
		toggle: handleToggle,
		channel: handleChannel,
	}
};
