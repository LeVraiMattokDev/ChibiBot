const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const globalCommands = [];
const devCommands = [];

const commandsPath = path.join(__dirname, 'src/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	
	if (command.data.name.startsWith('dev-') || command.data.name.startsWith('test-')) {
		devCommands.push(command.data.toJSON());
	} else {
		globalCommands.push(command.data.toJSON());
	}
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		console.log('Started refreshing application commands.');

		// Déployer les commandes globales
		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: globalCommands },
		);
		console.log(`Successfully reloaded ${globalCommands.length} global commands.`);

		// Déployer les commandes de développement sur le serveur de test
		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: devCommands },
		);
		console.log(`Successfully reloaded ${devCommands.length} development commands on the test guild.`);

	} catch (error) {
		console.error(error);
	}
})();

