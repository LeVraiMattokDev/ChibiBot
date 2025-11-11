const { Events, PermissionsBitField } = require('discord.js');
const db = require('../database');

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member) {
		try {
			// 1. Récupérer les paramètres du serveur
			const settings = await db.getGuildSettings(member.guild.id);

			// 2. Vérifier si le système est activé et configuré
			if (!settings || !settings.welcome_enabled || !settings.welcome_channel_id) {
				return;
			}

			// 3. Trouver le salon de bienvenue
			const channel = member.guild.channels.cache.get(settings.welcome_channel_id);
			if (!channel) {
				console.log(`[WARNING] Welcome channel not found for guild ${member.guild.id}`);
				return;
			}
			
			// 4. Vérifier les permissions
			if (!channel.permissionsFor(member.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
				console.log(`[WARNING] Missing SendMessages permission in welcome channel for guild ${member.guild.id}`);
				return;
			}

			// 5. Préparer le message
			const defaultMessage = `Bienvenue à toi, {user}, sur le serveur **{server}** ! Nous sommes maintenant {memberCount} membres.`;
			let welcomeMessage = settings.welcome_message || defaultMessage;

			welcomeMessage = welcomeMessage
				.replace(/{user}/g, member.toString())
				.replace(/{userName}/g, member.user.username)
				.replace(/{server}/g, member.guild.name)
				.replace(/{memberCount}/g, member.guild.memberCount.toString());

			// 6. Envoyer le message
			await channel.send(welcomeMessage);

		} catch (error) {
			console.error('[ERROR] Failed to send welcome message:', error);
		}
	},
};
