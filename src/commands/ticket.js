const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
const db = require('../database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ticket')
		.setDescription('Gère le système de tickets.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand =>
			subcommand
				.setName('setup')
				// ... (options existantes)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('adduser')
				.setDescription('Ajoute un utilisateur à un ticket.')
				.addUserOption(option => option.setName('utilisateur').setDescription('L\'utilisateur à ajouter.').setRequired(true))
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('removeuser')
				.setDescription('Retire un utilisateur d\'un ticket.')
				.addUserOption(option => option.setName('utilisateur').setDescription('L\'utilisateur à retirer.').setRequired(true))
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('close')
				.setDescription('Ferme le ticket et génère une transcription.')
				.addStringOption(option => option.setName('raison').setDescription('La raison de la fermeture.'))
		),
		
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'setup') {
			await handleSetup(interaction);
		} else if (subcommand === 'adduser') {
			await handleAddUser(interaction);
		} else if (subcommand === 'removeuser') {
			await handleRemoveUser(interaction);
		} else if (subcommand === 'close') {
			await handleClose(interaction);
		}
	},
};

// ... (fonction handleSetup existante)

async function handleAddUser(interaction) {
	const ticket = await db.getTicketByChannel(interaction.channel.id);
	if (!ticket) {
		return interaction.reply({ content: '❌ Cette commande ne peut être utilisée que dans un salon de ticket.', ephemeral: true });
	}

	const user = interaction.options.getUser('utilisateur');
	await interaction.channel.permissionOverwrites.edit(user.id, {
		ViewChannel: true,
		SendMessages: true,
		ReadMessageHistory: true,
	});

	await interaction.reply(`✅ ${user} a été ajouté au ticket.`);
}

async function handleRemoveUser(interaction) {
	const ticket = await db.getTicketByChannel(interaction.channel.id);
	if (!ticket) {
		return interaction.reply({ content: '❌ Cette commande ne peut être utilisée que dans un salon de ticket.', ephemeral: true });
	}

	const user = interaction.options.getUser('utilisateur');
	await interaction.channel.permissionOverwrites.delete(user.id);

	await interaction.reply(`✅ ${user} a été retiré du ticket.`);
}

async function handleClose(interaction) {
	const ticket = await db.getTicketByChannel(interaction.channel.id);
	if (!ticket) {
		return interaction.reply({ content: '❌ Cette commande ne peut être utilisée que dans un salon de ticket.', ephemeral: true });
	}
	
	await interaction.reply('Fermeture du ticket en cours...');

	// 1. Générer la transcription
	const attachment = await discordTranscripts.createTranscript(interaction.channel, {
		limit: -1,
		returnType: 'attachment',
		filename: `transcript-${interaction.channel.name}.html`,
		saveImages: false,
		poweredBy: false,
	});

	// 2. Envoyer la transcription dans le salon de log
	const config = await db.getTicketConfigById(ticket.config_id);
	if (config && config.log_channel_id) {
		const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
		if (logChannel) {
			const creator = await interaction.client.users.fetch(ticket.creator_id);
			const embed = new EmbedBuilder()
				.setTitle('Ticket Fermé')
				.setColor(0xED4245)
				.addFields(
					{ name: 'Ticket', value: interaction.channel.name, inline: true },
					{ name: 'Créateur', value: creator.tag, inline: true },
					{ name: 'Fermé par', value: interaction.user.tag, inline: true },
					{ name: 'Raison', value: interaction.options.getString('raison') || 'Aucune raison spécifiée.' }
				)
				.setTimestamp();
			await logChannel.send({ embeds: [embed], files: [attachment] });
		}
	}

	// 3. Mettre à jour la DB
	await db.closeTicket(interaction.channel.id, interaction.user.id);
	
	// 4. Supprimer le salon (après un court délai pour que l'utilisateur voie la confirmation)
	setTimeout(() => {
		interaction.channel.delete('Ticket fermé').catch(console.error);
	}, 5000);
}

