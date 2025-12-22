const { Events } = require('discord.js');
const db = require('../database');

// Pour éviter le spam, on ne donne de l'XP et de l'argent que toutes les 60 secondes.
const COOLDOWN = 60;

// C'est la formule qui détermine combien d'XP est nécessaire pour passer au niveau suivant.
// La difficulté augmente à chaque niveau.
function xpForLevel(level) {
    return 5 * (level ** 2) + (50 * level) + 100;
}

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot || !message.guild) return;

		try {
			const settings = await db.getGuildSettings(message.guild.id);
			if (!settings.economy_enabled && !settings.xp_enabled) {
				return;
			}
			
			const profile = await db.getUserProfile(message.author.id, message.guild.id);

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

				// Si un utilisateur gagne beaucoup d'XP d'un coup, cette boucle
				// lui permet de monter plusieurs niveaux en même temps.
				while (newXp >= xpNeeded) {
					newLevel++;
					newXp -= xpNeeded; // L'XP en trop est reporté pour le niveau suivant.
					xpNeeded = xpForLevel(newLevel);
					leveledUp = true;
				}

				updates.xp = newXp;
				if (leveledUp) {
					updates.level = newLevel;
					message.channel.send(`🎉 Bravo ${message.author}, tu viens de passer au **niveau ${newLevel}** !`);
				}
			}
			
			// On applique toutes les modifications (argent, xp, niveau) en une seule requête.
			if (Object.keys(updates).length > 1) {
				await db.updateUserProfile(message.author.id, message.guild.id, updates);
			}

		} catch (error) {
			console.error("Erreur lors de l'attribution d'XP/monnaie :", error);
		}
	},
};