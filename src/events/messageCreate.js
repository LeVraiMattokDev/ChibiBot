const { Events } = require('discord.js');
const db = require('../database');

// Cooldown en secondes pour éviter le spam d'XP/monnaie
const COOLDOWN = 60;

// Formule pour l'XP requis par niveau : 5 * (level ^ 2) + 50 * level + 100
function xpForLevel(level) {
    return 5 * (level ** 2) + (50 * level) + 100;
}

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		// Ignorer les bots et les messages en DM
		if (message.author.bot || !message.guild) return;

		try {
			// 1. Récupérer les paramètres du serveur et le profil de l'utilisateur
			const settings = await db.getGuildSettings(message.guild.id);
			const profile = await db.getUserProfile(message.author.id, message.guild.id);

			// 2. Vérifier le cooldown
			const now = Date.now();
			const lastMessageTimestamp = parseInt(profile.last_message_timestamp, 10);
			if ((now - lastMessageTimestamp) / 1000 < COOLDOWN) {
				return;
			}
			
			// 3. Mettre à jour le profil
			const newMoney = parseFloat(profile.money) + parseFloat(settings.economy_money_per_message);
			const newXp = parseInt(profile.xp, 10) + parseInt(settings.economy_xp_per_message);

			await db.updateUserProfile(message.author.id, message.guild.id, {
				money: newMoney,
				xp: newXp,
				last_message_timestamp: now,
			});

			// 4. Vérifier la montée de niveau
			const currentLevel = parseInt(profile.level, 10);
			const xpNeeded = xpForLevel(currentLevel);

			if (newXp >= xpNeeded) {
				const newLevel = currentLevel + 1;
				await db.updateUserProfile(message.author.id, message.guild.id, {
					level: newLevel,
					// Optionnel: on peut reset l'XP ou le laisser s'accumuler. On le laisse s'accumuler ici.
				});
				
				// Envoyer un message de félicitations
				message.channel.send(`🎉 Bravo ${message.author}, tu viens de passer au **niveau ${newLevel}** !`);
			}

		} catch (error) {
			console.error('Erreur lors de l\'attribution d\'XP/monnaie :', error);
		}
	},
};
