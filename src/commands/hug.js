const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Envoie un câlin chaleureux à un utilisateur.')
        .addUserOption(option => option.setName('utilisateur').setDescription('La personne à câliner.').setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('utilisateur');
        const user = interaction.user;

        await interaction.deferReply();

        try {
            console.log('[Hug] Appel à la nouvelle API waifu.pics...');
            const response = await fetch('https://api.waifu.pics/sfw/hug');
            console.log(`[Hug] Réponse de l'API reçue avec le statut : ${response.status}`);

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`L'API a retourné une erreur : ${response.status}. Corps de la réponse : ${errorBody}`);
            }

            const data = await response.json();
            
            if (!data.url) {
				throw new Error('Le format de la réponse de l\'API a changé et ne contient pas d\'URL.');
			}

            const embed = new EmbedBuilder()
                .setColor(0xFFC0CB) // Rose
                .setDescription(`**${user.username}** fait un gros câlin à **${target.username}** !`)
                .setImage(data.url);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('[Hug Commande Erreur]', error);
            await interaction.editReply('❌ Oups ! L\'API des GIFs semble avoir un hoquet. Réessayez plus tard.');
        }
    },
};
