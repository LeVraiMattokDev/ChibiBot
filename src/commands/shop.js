const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shop')
		.setDescription('Interagit avec le magasin du serveur.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('voir')
				.setDescription('Affiche les objets en vente dans le magasin.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('acheter')
				.setDescription('Achète un objet dans le magasin.')
				.addStringOption(option =>
					option.setName('objet')
						.setDescription('Le nom exact de l\'objet à acheter.')
						.setRequired(true))),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'voir') {
			await handleSeeShop(interaction);
		} else if (subcommand === 'acheter') {
			await handleBuyItem(interaction);
		}
	},
};

async function handleSeeShop(interaction) {
	await interaction.deferReply();
	const items = await db.getShopItems(interaction.guild.id);

	const embed = new EmbedBuilder()
		.setTitle(`Magasin de ${interaction.guild.name}`)
		.setColor(0x2ECC71);

	if (items.length === 0) {
		embed.setDescription('Le magasin est vide pour le moment. Revenez plus tard !');
	} else {
		embed.setDescription('Voici les objets disponibles à l\'achat :');
		items.forEach(item => {
			embed.addFields({
				name: `${item.name} - ${item.price} pièces`,
				value: item.description || 'Aucune description.',
			});
		});
	}

	await interaction.editReply({ embeds: [embed] });
}

async function handleBuyItem(interaction) {
	const itemName = interaction.options.getString('objet');
	await interaction.deferReply({ ephemeral: true });

	const item = await db.getShopItem(interaction.guild.id, itemName);
	if (!item) {
		return interaction.editReply(`❌ L\'objet "${itemName}" n\'existe pas dans le magasin.`);
	}

	const profile = await db.getUserProfile(interaction.user.id, interaction.guild.id);
	if (profile.money < item.price) {
		return interaction.editReply(`❌ Vous n\'avez pas assez d\'argent ! Il vous manque ${ (item.price - profile.money).toFixed(2) } pièces.`);
	}

	const newMoney = profile.money - item.price;
	await db.updateUserProfile(interaction.user.id, interaction.guild.id, { money: newMoney });

	// Note : Pour l'instant, l'achat ne fait rien d'autre que déduire l'argent.
	// La logique pour "donner" l'objet (ex: un rôle) serait à ajouter ici.
	
	await interaction.editReply(`✅ Félicitations ! Vous avez acheté **${item.name}** pour ${item.price} pièces.`);
}
