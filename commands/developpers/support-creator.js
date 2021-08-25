const { MessageEmbed } = require('discord.js');
const mysql = require('../../database/mysql.js');

module.exports = {
	name: 'support-creator',
	category: 'Developpers',
	description: 'Invite l\'administrateur à modifier le statut "Support" d\'un développeur/moddeur.',
	aliases: ['screa','supp','support'],
	usage: 'support-creator <DiscordID> || <DiscordUsername>',
	userperms: ['ADMINISTRATOR'],
	botperms: [],
    launchOnReady: false,
	run: async (client, message, args) => {
        if(args.length !== 1) {
            const numberArgs = new MessageEmbed().setDescription('La commande !support-creator nécessite un argument : l\'ID ou le pseudo de l\'utilisateur.').setColor('ORANGE'); 
            return message.channel.send(numberArgs);
        }
    
        let arg = args[0];

        const result = await mysql.read('users','support, discord_name, discord_id', `discord_id='${arg}' OR discord_name='${arg}'`);
        if(result.length === 1) {
            if(result[0].support === 1) {
                status = `${result[0].discord_name} gère son support. Voulez-vous modifier son statut ?`;
            } else {
                status = `${result[0].discord_name} ne gère pas son support. Voulez-vous modifier son statut ?`;
            }
    
            const filter = (reaction, user) => {
                return ['👍','👎'].includes(reaction.emoji.name) && user.id === message.author.id;
            }
            const devFound = new MessageEmbed().setDescription(status).setColor('BLUE');
            const statusUpdated = new MessageEmbed().setDescription('Statut mis à jour !').setColor('GREEN');
            const statusNotUptated = new MessageEmbed().setDescription('Aucune modification apportée au statut.').setColor('BLUE');
            const cmdTimeout = new MessageEmbed()
                .setTitle('Délai dépassé.')
                .setDescription(`Le statut de ${result[0].discord_name} n'a pas été modifié.`)
                .setColor('ORANGE');

            message.channel.send(devFound)
                .then(message => {
                    message.react('👍').then(() => message.react('👎'));
                    message.awaitReactions(filter, {max: 1, time: 60000, errors: ['time']})
                        .then(collected => {
                            const reaction = collected.first();
                            
                            if (reaction.emoji.name === '👍') {
                                if(result[0].support === 1) {
                                    mysql.update('users', 'support=0', `discord_id=${result[0].discord_id}`);
                                } else {
                                    mysql.update('users', 'support=1', `discord_id=${result[0].discord_id}`);
                                }
                                message.channel.send(statusUpdated);
                            } else {
                                message.channel.send(statusNotUptated);
                            }

                            message.reactions.removeAll()
                                .catch(error => console.error('Impossible de supprimer les réactions :', error));
                            })
                        .catch(collected => {
                            message.channel.send(cmdTimeout);
                        });
                })
                .catch(console.error);
        } else if (result.length > 1) {
            let list = '';
            Object.keys(result).forEach(function (key) {
                let row = result[key];
                list = list + '\n' + 'Discord ID : ' + row.discord_id;
            });

            const tooMuchResults = new MessageEmbed()
                .setTitle(`Le pseudo ${result[0].discord_name} est associé à plusieurs créateurs`)
                .setDescription(list)
                .addField('\u200B', 'Merci de relancer la commande avec l\'ID correspondant.', false)
                .setColor('ORANGE');
            return message.channel.send(tooMuchResults);
        }
        else {
            const devNotFound = new MessageEmbed().setDescription(`Erreur SQL.`).setColor('RED');
            return message.channel.send(devNotFound);
        }
	},
};