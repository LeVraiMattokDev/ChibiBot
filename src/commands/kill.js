const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kill')
        .setDescription('"Vaincre" quelqu\'un de manière théâtrale.')
        .addUserOption(option => option.setName('utilisateur').setDescription('La personne à vaincre.').setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('utilisateur');
        const user = interaction.user;
        await interaction.reply(`☠️ **${user.username}** a triomphé de **${target.username}** dans un combat épique !`);
    },
};
