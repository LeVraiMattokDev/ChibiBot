const { Events, ActivityType } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		const activities = [
			{ name: 'v0.0.2', type: ActivityType.Playing },
		];

		setInterval(() => {
			const status = activities[Math.floor(Math.random() * activities.length)];
			client.user.setActivity(status);
		}, 15000);
	},
};
