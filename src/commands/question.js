const { SlashCommandBuilder } = require('discord.js');

const questions = [
    'Si tu pouvais avoir un super-pouvoir, lequel choisirais-tu ?',
    'Quel est le plat que tu pourrais manger tous les jours ?',
    'Si tu étais un animal, lequel serais-tu ?',
    'Quel est ton film préféré de tous les temps ?',
    'Quel est le dernier morceau de musique qui t\'est resté en tête ?'
];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('question')
		.setDescription('Le bot vous pose une question aléatoire.'),
	async execute(interaction) {
        const question = questions[Math.floor(Math.random() * questions.length)];
		await interaction.reply(`🤔 **Question :** ${question}`);
	},
};
