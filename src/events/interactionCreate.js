const { Events, MessageFlags } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		// --- Slash Command Handler ---
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

		// --- Component Interaction Handler ---
		const [commandName, category, action] = interaction.customId.split('_');

		try {
			// Routeur pour le casier
			if (commandName === 'casier') {
				const casierCommand = interaction.client.commands.get('casier');
				if (casierCommand) await casierCommand.handlePagination(interaction);
				return;
			}

			// Routeur pour le panneau de configuration
			if (commandName === 'config') {
				const configCommand = interaction.client.commands.get('config');
				if (!configCommand) return;

				if (category === 'main') {
					await interaction.update(await configCommand.handleMain(interaction));
					return;
				}

				const panel = configCommand.panels.get(category);
				if (panel && panel.handlers[action]) {
					const response = await panel.handlers[action](interaction);
					if (response) { // Si le handler retourne une nouvelle vue, on la met à jour
						await interaction.update(response);
					}
				}
				return;
			}
		} catch (error) {
			console.error(`[ERROR] Error handling component interaction (${interaction.customId})`, error);
		}
	},
};
