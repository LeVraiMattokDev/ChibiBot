const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const gifs = [
    'https://media.giphy.com/media/uG3lKbw5Kk5P2/giphy.gif',
    'https://media.giphy.com/media/3XlEk2RxPS1m8/giphy.gif',
    'https://media.giphy.com/media/gSIz6gGLhguOY/giphy.gif'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slap')
        .setDescription('"Frapper" quelqu\'un de façon humoristique.')
        .addUserOption(option => option.setName('utilisateur').setDescription('La personne à frapper.').setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('utilisateur');
        const user = interaction.user;

        const gif = gifs[Math.floor(Math.random() * gifs.length)];
        
        const embed = new EmbedBuilder()
            .setColor(0xFF0000) // Rouge
            .setDescription(`**${user.username}** donne une claque à **${target.username}** !`)
            .setImage(gif);

        await interaction.reply({ embeds: [embed] });
    },
};
