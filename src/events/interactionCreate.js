const { Events, MessageFlags } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		// --- Slash Command Handler ---
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) {
				console.error(`[ERROR] No command matching ${interaction.commandName} was found.`);
				return;
			}
			// Logger
			const user = interaction.user.tag;
			const commandName = interaction.commandName;
			const guild = interaction.guild ? interaction.guild.name : 'Direct Message';
			const channel = interaction.channel ? interaction.channel.name : 'N/A';
			console.log(`[Activity] User: ${user} | Command: /${commandName} | Server: "${guild}" | Channel: #${channel}`);

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(`[ERROR] Error executing /${interaction.commandName}`, error);
				const errorPayload = { content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral };
				if (interaction.replied || interaction.deferred) await interaction.followUp(errorPayload);
				else await interaction.reply(errorPayload);
			}
			return;
		}

		// --- Component Interaction Handler (Menus, Boutons, etc.) ---
		const configCommand = interaction.client.commands.get('config');
		if (!configCommand) return; // Sécurité

		try {
			// Menus déroulants
			if (interaction.isStringSelectMenu()) {
				if (interaction.customId === 'config_category_select') await configCommand.handleCategorySelect(interaction);
				if (interaction.customId === 'welcome_channel_select') await configCommand.handleWelcomeChannel(interaction);
				if (interaction.customId === 'logs_channel_select') await configCommand.handleLogsChannel(interaction);
				return;
			}
			// Boutons
			if (interaction.isButton()) {
				if (interaction.customId === 'config_main_menu') await configCommand.handleBack(interaction);
				if (interaction.customId === 'welcome_toggle') await configCommand.handleWelcomeToggle(interaction);
				if (interaction.customId === 'welcome_message_modal') await configCommand.handleWelcomeMessageModal(interaction);
				return;
			}
			// Popups (Modals)
			if (interaction.isModalSubmit()) {
				if (interaction.customId === 'welcome_message_modal_submit') await configCommand.handleWelcomeMessageSubmit(interaction);
				return;
			}
		} catch (error) {
			console.error('[ERROR] Error handling component interaction', error);
			const errorPayload = { content: 'There was an error while handling this interaction!', flags: MessageFlags.Ephemeral };
			if (interaction.replied || interaction.deferred) await interaction.followUp(errorPayload);
			else await interaction.reply(errorPayload);
		}
	},
};

