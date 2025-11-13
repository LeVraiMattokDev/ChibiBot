const { SlashCommandBuilder } = require('discord.js');

const responses = [
	'C\'est certain.', 'Sans aucun doute.', 'Oui, absolument.', 'Vous pouvez compter dessus.',
	'Très probable.', 'Oui.', 'Les signes pointent vers un oui.', 'Probablement.',
	'Réponse floue, essayez à nouveau.', 'Redemandez plus tard.', 'Mieux vaut ne pas vous le dire maintenant.',
	'Ne comptez pas dessus.', 'Ma réponse est non.', 'Mes sources disent non.', 'Très peu probable.', 'Non.'
];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('8ball')
		.setDescription('Demande conseil à la boule magique.')
		.addStringOption(option => option.setName('question').setDescription('La question à poser.').setRequired(true)),
	async execute(interaction) {
		const question = interaction.options.getString('question');
		const answer = responses[Math.floor(Math.random() * responses.length)];
		await interaction.reply(`> **Question :** ${question}\n🎱 **Réponse :** ${answer}`);
	},
};
