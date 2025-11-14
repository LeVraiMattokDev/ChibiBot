const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const db = require('../database');
const { colors } = require('../utils/constants');

async function build(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const s = (bool) => bool ? '✅ Activé' : '❌ Désactivé';

	const embed = new EmbedBuilder().setTitle('🏪 Config. Magasin').setColor(colors.grey)
		.addFields({ name: 'Statut', value: s(settings.shop_enabled) })
		.setDescription('La gestion des objets se fait via les commandes `/shop ajouter` et `/shop supprimer`.');
	
	const toggle = new ButtonBuilder().setCustomId('config_shop_toggle').setLabel(settings.shop_enabled ? 'Désactiver' : 'Activer').setStyle(settings.shop_enabled ? ButtonStyle.Danger : ButtonStyle.Success);
	const backBtn = new ButtonBuilder().setCustomId('config_main_build').setLabel('Retour').setStyle(ButtonStyle.Secondary);

	return { embeds: [embed], components: [new ActionRowBuilder().addComponents(toggle, backBtn)], ephemeral: true };
}

async function handleToggle(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	await db.setGuildSettings(interaction.guild.id, { shop_enabled: !settings.shop_enabled });
	return build(interaction);
}

module.exports = {
	name: 'shop',
	build: build,
	handlers: {
		toggle: handleToggle,
	}
};
