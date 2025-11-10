const { Events, MessageFlags } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`[ERROR] No command matching ${interaction.commandName} was found.`);
			return;
		}

		// --- Début de l'ajout du logger ---
		const user = interaction.user.tag;
		const commandName = interaction.commandName;
		const guild = interaction.guild ? interaction.guild.name : 'Direct Message';
		const channel = interaction.channel ? interaction.channel.name : 'N/A';

		console.log(`[Activity] User: ${user} | Command: /${commandName} | Server: "${guild}" | Channel: #${channel}`);
		// --- Fin de l'ajout du logger ---

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(`[ERROR] Error executing /${interaction.commandName}`);
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			}
		}
	},
};

