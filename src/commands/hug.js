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
            const response = await fetch('https://some-random-api.com/animu/hug');
            const data = await response.json();

            const embed = new EmbedBuilder()
                .setColor(0xFFC0CB) // Rose
                .setDescription(`**${user.username}** fait un gros câlin à **${target.username}** !`)
                .setImage(data.link);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Impossible de récupérer un GIF pour le moment.');
        }
    },
};
