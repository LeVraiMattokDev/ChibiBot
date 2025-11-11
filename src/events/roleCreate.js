const { Events, EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
	name: Events.RoleCreate,
	async execute(role) {
		const embed = new EmbedBuilder()
			.setColor(0x57F287)
			.setTitle('Rôle Créé')
			.setDescription(`Le rôle ${role} (\`${role.name}\`) a été créé.`)
			.setTimestamp();
			
		await logAction(role.guild, embed);
	},
};
