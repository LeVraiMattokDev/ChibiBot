const { Events, MessageFlags } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) return console.error(`[ERROR] No command matching ${interaction.commandName} was found.`);
			
			console.log(`[Activity] User: ${interaction.user.tag} | Command: /${interaction.commandName}`);

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

				// --- GESTION DES SOUMISSIONS DE MODALS ---
		if (interaction.isModalSubmit()) {
			// Si le modal vient du système de configuration
			if (interaction.customId.startsWith('config_')) {
				const configCommand = interaction.client.commands.get('config');
				if (configCommand) {
					await configCommand.handleModalSubmit(interaction);
				}
			}
			return;
		}

		// --- GESTION DES AUTRES COMPOSANTS (BOUTONS, MENUS) ---
		if (interaction.isButton() || interaction.isStringSelectMenu()) {
			const [commandName] = interaction.customId.split('_');
	
			try {
				if (commandName === 'casier') {
					const casierCommand = interaction.client.commands.get('casier');
					if (casierCommand) await casierCommand.handlePagination(interaction);
				}
				
			} catch (error) {
				console.error(`[ERROR] Error handling component interaction (${interaction.customId})`, error);
			}
		}
	},
};
