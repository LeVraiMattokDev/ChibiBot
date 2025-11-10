const { Events, ActivityType } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		const activities = [
			{ name: 'vous surveiller', type: ActivityType.Watching },
			{ name: 'de la musique', type: ActivityType.Listening },
			{ name: 'au yams', type: ActivityType.Playing },
			{ name: '/ping', type: ActivityType.Watching },
		];

		setInterval(() => {
			const status = activities[Math.floor(Math.random() * activities.length)];
			client.user.setActivity(status);
		}, 15000);
	},
};
