const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pat')
        .setDescription('Donne une tape amicale.')
        .addUserOption(option => option.setName('utilisateur').setDescription('La personne à tapoter.').setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('utilisateur');
        const user = interaction.user;

        await interaction.deferReply();

        try {
            const response = await fetch('https://some-random-api.com/animu/pat');
            const data = await response.json();

            const embed = new EmbedBuilder()
                .setColor(0xADD8E6) // Bleu clair
                .setDescription(`**${user.username}** tapote gentiment **${target.username}**.`)
                .setImage(data.link);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Impossible de récupérer un GIF pour le moment.');
        }
    },
};
