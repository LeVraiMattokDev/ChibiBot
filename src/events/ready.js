const { Events, ActivityType } = require('discord.js');
const { version } = require('../../package.json'); // Importe la version

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		const activities = [
			{ name: `v${version}`, type: ActivityType.Playing }, // Ajout de la version
		];

		setInterval(() => {
			const status = activities[Math.floor(Math.random() * activities.length)];
			client.user.setActivity(status);
		}, 5000);
	},
};
