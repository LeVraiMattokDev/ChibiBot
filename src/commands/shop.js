const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shop')
		.setDescription('Interagit avec le magasin du serveur.')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages) // Permission de base pour voir/acheter
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
						.setRequired(true)))
		.addSubcommand(subcommand => // Sous-commande Admin
			subcommand
				.setName('ajouter')
				.setDescription('[Admin] Ajoute un objet au magasin.')
				.addStringOption(option => option.setName('nom').setDescription('Le nom de l\'objet.').setRequired(true))
				.addNumberOption(option => option.setName('prix').setDescription('Le prix de l\'objet.').setRequired(true).setMinValue(0))
				.addStringOption(option => option.setName('description').setDescription('Une courte description de l\'objet.')))
		.addSubcommand(subcommand => // Sous-commande Admin
			subcommand
				.setName('supprimer')
				.setDescription('[Admin] Supprime un objet du magasin.')
				.addStringOption(option => option.setName('nom').setDescription('Le nom exact de l\'objet à supprimer.').setRequired(true))),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'voir') {
			await handleSeeShop(interaction);
		} else if (subcommand === 'acheter') {
			await handleBuyItem(interaction);
		} else if (subcommand === 'ajouter') {
			if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
				return interaction.reply({ content: '❌ Vous devez être administrateur pour utiliser cette commande.', ephemeral: true });
			}
			await handleAddItem(interaction);
		} else if (subcommand === 'supprimer') {
			if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
				return interaction.reply({ content: '❌ Vous devez être administrateur pour utiliser cette commande.', ephemeral: true });
			}
			await handleRemoveItem(interaction);
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
		return interaction.editReply(`❌ L'objet "${itemName}" n'existe pas dans le magasin.`);
	}

	const profile = await db.getUserProfile(interaction.user.id, interaction.guild.id);
	
	// S'assurer que les prix et l'argent sont traités comme des nombres à virgule flottante
	const userMoney = parseFloat(profile.money);
	const itemPrice = parseFloat(item.price);

	if (userMoney < itemPrice) {
		return interaction.editReply(`❌ Vous n'avez pas assez d'argent ! Il vous manque **${(itemPrice - userMoney).toFixed(2)}** pièces.`);
	}

	try {
		// 1. Ajouter l'objet à l'inventaire de l'utilisateur
		await db.addUserItemToInventory(interaction.guild.id, interaction.user.id, item.id);

		// 2. Mettre à jour le solde de l'utilisateur
		const newMoney = userMoney - itemPrice;
		await db.updateUserProfile(interaction.user.id, interaction.guild.id, { money: newMoney.toFixed(2) });

		await interaction.editReply(`✅ Félicitations ! Vous avez acheté **${item.name}** pour **${itemPrice}** pièces. Il a été ajouté à votre inventaire.`);
	} catch (error) {
		console.error("Erreur lors de l'achat d'un objet :", error);
		// On pourrait ajouter une logique pour annuler l'ajout à l'inventaire si la mise à jour de l'argent échoue,
		// mais pour l'instant, un simple message d'erreur est suffisant.
		await interaction.editReply("❌ Une erreur est survenue lors de votre achat. Veuillez contacter un administrateur.");
	}
}

async function handleAddItem(interaction) {
	const name = interaction.options.getString('nom');
	const price = interaction.options.getNumber('prix');
	const description = interaction.options.getString('description') || 'Aucune description.';
	
	await interaction.deferReply({ ephemeral: true });

	try {
		await db.addShopItem(interaction.guild.id, name, description, price);
		await interaction.editReply(`✅ L'objet **${name}** a été ajouté au magasin pour **${price}** pièces.`);
	} catch (error) {
		// Gère le cas où l'objet existe déjà (contrainte UNIQUE dans la DB)
		if (error.code === 'ER_DUP_ENTRY') {
			return interaction.editReply(`❌ Un objet nommé **${name}** existe déjà dans le magasin.`);
		}
		console.error('Erreur lors de l\'ajout d\'un objet au shop :', error);
		await interaction.editReply('❌ Une erreur est survenue.');
	}
}

async function handleRemoveItem(interaction) {
	const name = interaction.options.getString('nom');
	await interaction.deferReply({ ephemeral: true });
	
	const affectedRows = await db.removeShopItem(interaction.guild.id, name);

	if (affectedRows > 0) {
		await interaction.editReply(`✅ L'objet **${name}** a été supprimé du magasin.`);
	} else {
		await interaction.editReply(`❌ Aucun objet nommé **${name}** n'a été trouvé dans le magasin.`);
	}
}

