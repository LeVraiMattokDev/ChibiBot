const { Events, MessageFlags, EmbedBuilder } = require('discord.js');
const { colors } = require('../utils/constants');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		try {
			// --- GESTION DES COMMANDES (SLASH COMMANDS) ---
			if (interaction.isChatInputCommand()) {
				const command = interaction.client.commands.get(interaction.commandName);
				if (!command) {
					console.error(`[ERROR] No command matching ${interaction.commandName} was found.`);
					return;
				}

				console.log(`[Activity] User: ${interaction.user.tag} (ID: ${interaction.user.id}) | Command: /${interaction.commandName}`);

				try {
					await command.execute(interaction);
				} catch (error) {
					console.error(`[ERROR] Error executing /${interaction.commandName}:`, error);
					const errorEmbed = new EmbedBuilder()
						.setColor(colors.error)
						.setTitle('Erreur Système')
						.setDescription('Une erreur inattendue est survenue lors de l\'exécution de cette commande.')
						.setFooter({ text: 'Veuillez signaler ce problème à un administrateur.' });

					const payload = { embeds: [errorEmbed], flags: MessageFlags.Ephemeral };

					if (interaction.replied || interaction.deferred) {
						await interaction.followUp(payload);
					} else {
						await interaction.reply(payload);
					}
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
				if (!interaction.customId) return;
				const [commandName] = interaction.customId.split('_');

				if (!commandName) return;

				// Logique spécifique pour certaines commandes qui gèrent leurs propres boutons
				if (commandName === 'casier') {
					const casierCommand = interaction.client.commands.get('casier');
					if (casierCommand) await casierCommand.handlePagination(interaction);
				}
			}
		} catch (error) {
			console.error(`[CRITICAL] Unhandled error in interactionCreate:`, error);
		}
	},
};
