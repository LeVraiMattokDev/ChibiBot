const { Events, ActivityType } = require('discord.js');
const { version } = require('../../package.json'); // Importe la version

module.exports = {
	name: Events.ClientReady,
	once: true,
		execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		// Définit l'activité une seule fois au démarrage
		client.user.setActivity(`v${version}`, { type: ActivityType.Playing });
	},
};
