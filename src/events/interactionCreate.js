const { Events, MessageFlags, ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		// --- Slash Command Handler ---
		if (interaction.isChatInputCommand()) {
			// ... (code existant)
			return;
		}
		
		// --- Ticket Creation Handler ---
		if (interaction.isButton() && interaction.customId.startsWith('ticket_create_')) {
			await handleTicketCreation(interaction);
			return;
		}

		// --- Component Interaction Handler (Menus, Boutons, etc.) ---
		// ... (code existant)
	},
};

async function handleTicketCreation(interaction) {
	await interaction.deferReply({ ephemeral: true });
	const guild = interaction.guild;
	const creator = interaction.user;
	
	try {
		const config = await db.getTicketConfigByMessage(interaction.message.id);
		if (!config) {
			return interaction.editReply('❌ Une erreur est survenue : impossible de trouver la configuration de ce panneau.');
		}

		const category = guild.channels.cache.get(config.category_id);
		if (!category || category.type !== ChannelType.GuildCategory) {
			return interaction.editReply('❌ Erreur de configuration : la catégorie définie n\'existe plus.');
		}
		
		// Crée le salon du ticket
		const ticketChannel = await guild.channels.create({
			name: `ticket-${creator.username}`,
			type: ChannelType.GuildText,
			parent: category,
			permissionOverwrites: [
				{
					id: guild.roles.everyone, // @everyone
					deny: [PermissionsBitField.Flags.ViewChannel],
				},
				{
					id: creator.id,
					allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
				},
				{
					id: config.support_role_id,
					allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
				},
				{
					id: interaction.client.user.id, // Le bot
					allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.AttachFiles],
				}
			],
		});

		// Enregistre le ticket dans la DB
		await db.createTicketRecord(guild.id, ticketChannel.id, creator.id, config.id);

		// Envoie un message de bienvenue dans le ticket
		const embed = new EmbedBuilder()
			.setTitle(config.title)
			.setDescription(`Bonjour ${creator}, bienvenue dans votre ticket. Un membre du staff va bientôt vous répondre.\n\nVeuillez décrire votre problème en détail.`)
			.setColor(0x57F287);
			
		const closeButton = new ButtonBuilder()
			.setCustomId(`ticket_close_${ticketChannel.id}`)
			.setLabel('Fermer le Ticket')
			.setStyle(ButtonStyle.Danger)
			.setEmoji('🔒');
			
		const row = new ActionRowBuilder().addComponents(closeButton);

		await ticketChannel.send({ content: `${creator} <@&${config.support_role_id}>`, embeds: [embed], components: [row] });
		
		await interaction.editReply(`✅ Votre ticket a été créé : ${ticketChannel}`);

	} catch (error) {
		console.error('Erreur lors de la création du ticket :', error);
		await interaction.editReply('❌ Une erreur est survenue lors de la création de votre ticket.');
	}
}


