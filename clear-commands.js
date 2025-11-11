// Script à usage unique pour nettoyer les commandes slash fantômes.

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

const rest = new REST({ version: '10' }).setToken(token);

async function clearCommands() {
	try {
		// Nettoyer les commandes de guilde (pour le serveur de test)
		console.log('Started clearing application (/) commands for the guild.');
		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: [] },
		);
		console.log('Successfully cleared application (/) commands for the guild.');

		// Nettoyer les commandes globales
		console.log('Started clearing global application (/) commands.');
		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: [] },
		);
		console.log('Successfully cleared global application (/) commands.');

	} catch (error) {
		console.error('Failed to clear commands:', error);
	}
}

clearCommands();
