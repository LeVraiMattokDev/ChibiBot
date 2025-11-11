const { Events, ActivityType } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		const activities = [
			{ name: 'Powered with JavaScript', type: ActivityType.Playing },
			{ name: 'Start with /config', type: ActivityType.Playing },
			{ name: 'Serveur Support', type: ActivityType.Streaming, url: 'https://discord.gg/qeH3vrfMU2' },
		];

		setInterval(() => {
			const status = activities[Math.floor(Math.random() * activities.length)];
			client.user.setActivity(status);
		}, 15000);
	},
};
