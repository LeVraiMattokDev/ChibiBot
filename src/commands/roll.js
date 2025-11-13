const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Lance un ou plusieurs dés.')
		.addStringOption(option => option.setName('dés').setDescription('Le type de dés (ex: 1d20, 2d6, d100)').setRequired(true)),
	async execute(interaction) {
		const diceString = interaction.options.getString('dés').toLowerCase();
		const match = diceString.match(/^(\d*)d(\d+)$/);

		if (!match) {
			return interaction.reply({ content: 'Format de dé invalide. Utilisez un format comme `1d20`, `2d6`, ou `d100`.', ephemeral: true });
		}

		const numDice = match[1] ? parseInt(match[1], 10) : 1;
		const numSides = parseInt(match[2], 10);

		if (numDice > 100 || numSides > 1000) {
			return interaction.reply({ content: 'Arrête de faire le malin. Pas plus de 100 dés et 1000 faces.', ephemeral: true });
		}

		let total = 0;
		const rolls = [];
		for (let i = 0; i < numDice; i++) {
			const roll = Math.floor(Math.random() * numSides) + 1;
			rolls.push(roll);
			total += roll;
		}

		await interaction.reply(`🎲 Vous avez lancé ${numDice} dé(s) à ${numSides} faces.\nRésultat : **${total}** (\`${rolls.join(', ')}\`)`);
	},
};
