const { MessageEmbed } = require('discord.js');
const config = require('../../config.json');
const mysql = require('../../database/mysql.js');
const date = require('../../functions/getDate.js');

module.exports = {
	name: 'remove-creator',
	category: 'Developpers',
	description: 'Supprimer un créateur.',
	aliases: ['rcrea', 'remove', 'rem'],
	usage: '!remove-creator <DiscordID> || <DiscordUsername>',
	userperms: ['ADMINISTRATOR'],
	botperms: [],
	launchOnReady: false,
	run: async (client, message, args) => {
        if(args.length !== 1) {
            const numberArgs = new MessageEmbed().setDescription('La commande !remove-creator nécessite un argument : l\'ID ou le pseudo de l\'utilisateur.').setColor('ORANGE'); 
            return message.channel.send(numberArgs);
        }
    
        let arg = args[0];
        let removed_by = message.author.username;

        const result = await mysql.read('users','discord_name, discord_id, role_id, category_id, removed', `discord_id='${arg}' OR discord_name='${arg}'`);
        if(result.length === 1) {
            const status = result[0].removed;
            const creator = result[0].discord_name;

            if (status === 1) {
                const creaRemoved = new MessageEmbed().setDescription(`${creator} est déjà supprimé.`).setColor('RED');
                return message.channel.send(creaRemoved);
            }

            const role = message.guild.roles.cache.get(result[0].role_id);
            const category = client.channels.cache.get(result[0].category_id);
            const channels = client.channels.cache.filter(c => c.parentID === result[0].category_id);

            const filter = (reaction, user) => {
                return ['👍','👎'].includes(reaction.emoji.name) && user.id === message.author.id;
            }

            const creaFound = new MessageEmbed().setDescription(`Voulez-vous supprimer le créateur ${creator} ?`).setColor('BLUE');
            const creaDeleted = new MessageEmbed().setDescription(`${creator} a bien été supprimé !`).setColor('GREEN');
            const creaNotDeleted = new MessageEmbed().setDescription(`${creator} n'a pas été supprimé.`).setColor('BLUE');
            const cmdTimeout = new MessageEmbed()
                .setTitle('Délai dépassé.')
                .setDescription(`Le statut de ${creator} n'a pas été modifié.`)
                .setColor('ORANGE');

            message.channel.send(creaFound)
                .then(message => {
                    message.react('👍').then(() => message.react('👎'));
                    message.awaitReactions(filter, {max: 1, time: 60000, errors: ['time']})
                        .then(async collected => {
                            const reaction = collected.first();
                            
                            if (reaction.emoji.name === '👍') {
                                
                                await channels.forEach(async c => {
                                   await c.delete();
                                });
                                await category.delete();
                                role.delete();

                                mysql.update('users', 
                                    `removed=1, removed_date='${date.getDate}', removed_by='${removed_by}'`, 
                                    `discord_id=${result[0].discord_id}`
                                );

                                message.channel.send(creaDeleted);
                            } else {
                                message.channel.send(creaNotDeleted);
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
        } else {
            const creaNotFound = new MessageEmbed().setDescription(`Erreur SQL.`).setColor('RED');
            return message.channel.send(creaNotFound);
        }
	},
};