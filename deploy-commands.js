const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('node:fs');
const path = require('node:path');

async function deployCommands(config) {
	const { clientId, token } = config;
	const commands = [];
	const commandsPath = path.join(__dirname, 'src/commands');
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		commands.push(command.data.toJSON());
	}

const rest = new REST({ version: '10' }).setToken(token);

	try {
		console.log('Started refreshing GLOBAL application (/) commands.');
		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);
		console.log('Successfully reloaded GLOBAL application (/) commands.');
	} catch (error) {
		console.error(error);
	}
}

module.exports = { deployCommands };

