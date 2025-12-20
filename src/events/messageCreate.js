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
			const settings = await db.getGuildSettings(message.guild.id);
			if (!settings.economy_enabled && !settings.xp_enabled) {
				return;
			}
			
			const profile = await db.getUserProfile(message.author.id, message.guild.id);

			// Applique un cooldown pour éviter le spam
			const now = Date.now();
			const lastMessageTimestamp = parseInt(profile.last_message_timestamp, 10);
			if ((now - lastMessageTimestamp) / 1000 < COOLDOWN) {
				return;
			}
			
			const updates = { last_message_timestamp: now };

			if (settings.economy_enabled) {
				updates.money = parseFloat(profile.money) + parseFloat(settings.economy_money_per_message);
			}

			if (settings.xp_enabled) {
				let newXp = parseInt(profile.xp, 10) + parseInt(settings.economy_xp_per_message);
				let newLevel = parseInt(profile.level, 10);
				let xpNeeded = xpForLevel(newLevel);
				let leveledUp = false;

				// Boucle pour gérer les montées de niveau multiples
				while (newXp >= xpNeeded) {
					newLevel++;
					newXp -= xpNeeded; // Reporter l'XP excédentaire
					xpNeeded = xpForLevel(newLevel);
					leveledUp = true;
				}

				updates.xp = newXp;
				if (leveledUp) {
					updates.level = newLevel;
					message.channel.send(`🎉 Bravo ${message.author}, tu viens de passer au **niveau ${newLevel}** !`);
				}
			}
			
			// Appliquer toutes les mises à jour en une seule fois
			if (Object.keys(updates).length > 1) {
				await db.updateUserProfile(message.author.id, message.guild.id, updates);
			}

		} catch (error) {
			console.error("Erreur lors de l'attribution d'XP/monnaie :", error);
		}
	},
};