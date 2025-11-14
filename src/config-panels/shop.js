const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const db = require('../database');
const { colors } = require('../utils/constants');

async function buildShopMenu(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	const s = (bool) => bool ? '✅ Activé' : '❌ Désactivé';

	const embed = new EmbedBuilder().setTitle('🏪 Config. Magasin').setColor(colors.grey)
		.addFields({ name: 'Statut', value: s(settings.shop_enabled) })
		.setDescription('Le magasin utilise les commandes `/shop ajouter` et `/shop supprimer` pour la gestion des objets.');
	
	const toggle = new ButtonBuilder().setCustomId('config_shop_toggle').setLabel(settings.shop_enabled ? 'Désactiver' : 'Activer').setStyle(settings.shop_enabled ? ButtonStyle.Danger : ButtonStyle.Success);
	const backBtn = new ButtonBuilder().setCustomId('config_main').setLabel('Retour').setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder().addComponents(toggle, backBtn);
	return { embeds: [embed], components: [row], ephemeral: true };
}

async function handleShopToggle(interaction) {
	const settings = await db.getGuildSettings(interaction.guild.id);
	await db.setGuildSettings(interaction.guild.id, { shop_enabled: !settings.shop_enabled });
	return buildShopMenu(interaction);
}

module.exports = {
	name: 'shop',
	build: buildShopMenu,
	handlers: {
		toggle: handleShopToggle,
	}
};
