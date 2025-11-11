const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { blaguesApiToken } = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blague')
		.setDescription('Raconte une blague aléatoire.'),

	async execute(interaction) {
		if (!blaguesApiToken) {
			return interaction.reply({ content: '❌ L\'API de blagues n\'est pas configurée par le développeur.', flags: MessageFlags.Ephemeral });
		}

		await interaction.deferReply();

		try {
			const response = await fetch('https://www.blagues-api.fr/api/random', {
				headers: {
					'Authorization': `Bearer ${blaguesApiToken}`
				}
			});

			if (!response.ok) {
				throw new Error(`L'API a retourné une erreur : ${response.status}`);
			}

			const data = await response.json();

			const embed = new EmbedBuilder()
				.setColor(0xFFFF00) // Jaune
				.setTitle(data.joke)
				.setDescription(`||${data.answer}||`) // La réponse est masquée (spoiler)
				.setFooter({ text: 'Blague fournie par Blagues-API.fr' });

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error('Erreur lors de la récupération de la blague :', error);
			await interaction.editReply({ content: '❌ Impossible de récupérer une blague pour le moment. Réessayez plus tard.' });
		}
	},
};
