const { MessageEmbed } = require('discord.js');
const mysql = require('../../database/mysql.js');

module.exports = {
	name: 'who-support',
	category: 'Developpers',
	description: 'Liste les créateurs qui gèrent leur support.',
	aliases: ['swho'],
	usage: 'who-support',
	userperms: ['ADMINISTRATOR'],
	botperms: [],
    launchOnReady: false,
	run: async (client, message, args) => {
        if(args.length > 0) {
            const toMuchArgs = new MessageEmbed().setDescription('La commande !who-support ne nécessite aucun argument.').setColor('ORANGE');
            return message.channel.send(toMuchArgs);
        }
    
        const result = await mysql.read('users','support, discord_name', `support=1`);

        if(result.length > 0) {
            let list = '';
            Object.keys(result).forEach(function (key) {
                let row = result[key];
                list = list + '\n' + row.discord_name;
            });

            const listCrea = new MessageEmbed()
                .setTitle('Liste des créateurs qui gèrent leur support :')
                .setColor('BLUE')
                .setDescription(list);

            message.channel.send(listCrea);
        } else {
            const noMatch = new MessageEmbed().setDescription('Aucun créateur ne gère son support.').setColor('BLUE');
            return message.channel.send(noMatch);
        }
	},
};