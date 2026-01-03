const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const db = require('./src/database');
const { logAction } = require('./src/utils/logger');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildWebhooks,
	]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'src/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const eventsPath = path.join(__dirname, 'src/events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

(async () => {
	await db.init();

	// On vérifie périodiquement les bannissements temporaires qui ont expiré.
	setInterval(async () => {
		try {
			const expiredBans = await db.getExpiredBans();
			if (expiredBans.length === 0) return;

			console.log(`[TempBan] Found ${expiredBans.length} expired ban(s).`);

			for (const ban of expiredBans) {
				const guild = await client.guilds.fetch(ban.guildId).catch(() => null);
				if (!guild) continue;

				try {
					await guild.members.unban(ban.userId, 'Le bannissement temporaire a expiré.');
					await db.revokeSanction(ban.id, ban.guildId, client.user.id, client.user.tag, 'Expiration automatique');
					console.log(`[TempBan] Unbanned ${ban.userName} from ${guild.name}.`);

					const user = await client.users.fetch(ban.userId);
					const embed = new (require('discord.js').EmbedBuilder)()
						.setTitle('Membre Débanni (Automatique)')
						.setColor(0x57F287)
						.addFields(
							{ name: 'Membre', value: `${user.tag} (${user.id})` },
							{ name: 'Raison', value: 'Le bannissement temporaire a expiré.' }
						)
						.setTimestamp();

					await logAction(guild, embed);

				} catch (error) {
					// Si l'utilisateur a déjà été débanni manuellement, Discord renvoie une erreur "Unknown Ban".
					// Dans ce cas, on met simplement à jour la sanction en base de données sans rien faire d'autre.
					if (error.code === 10026) { // Unknown Ban
						await db.revokeSanction(ban.id, ban.guildId, client.user.id, client.user.tag, 'Déjà débanni');
					} else {
						console.error(`[TempBan] Failed to unban user ${ban.userId} from guild ${ban.guildId}:`, error);
					}
				}
			}
		} catch (error) {
			console.error('[ERROR] Failed to check for expired bans:', error);
		}
	}, 60 * 1000);

	client.login(token);
})();
