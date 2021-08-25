const { MessageEmbed } = require('discord.js');
const sourcebin = require('sourcebin');
const config = require('../../config.json');
const mysql = require('../../database/mysql.js');
const date = require('../../functions/getDate.js');

module.exports = {
	name: 'close',
	category: 'Tickets',
	description: 'Clore un ticket.',
	aliases: [],
	usage: '!close',
	userperms: [],
	botperms: [],
	launchOnReady: false,
	run: async (client, message, args) => {
        if(args.length > 0) {
			const numberArgs = new MessageEmbed().setDescription(`La commande !close ne nécessite aucun argument.`).setColor('ORANGE');
            return message.channel.send(numberArgs);
        }
        
        if(message.channel.name.includes('ticket-')) {
            const confirm = new MessageEmbed().setDescription(`Voulez-vous clôturer ce ticket ?`).setColor('BLUE');
            const filter = (reaction, user) => {
                return ['👍','👎'].includes(reaction.emoji.name) && user.id === message.author.id;
            }

            message.channel.send(confirm)
                .then(message => {
                    message.react('👍').then(() => message.react('👎'));
                    message.awaitReactions(filter, {max: 1, time: 60000, errors: ['time']})
                        .then(async collected => {
                            const reaction = collected.first();
                            
                            if (reaction.emoji.name === '👍') {
                                await mysql.update('tickets', `closed=1, closed_date='${date.getDate}', closer_id='${message.author.id}'`, `ticket_id=${message.channel.id}`);
        
                                const ticketData = await mysql.read('tickets', 
                                    'opener_id, DATE_FORMAT(opened_date, "%d/%m/%Y %H:%i:%s") AS opened_date, DATE_FORMAT(closed_date, "%d/%m/%Y %H:%i:%s") as closed_date', 
                                    `ticket_id='${message.channel.id}'`
                                );
                                let opener = '';
                                let openDate = '';
                                let closeDate = '';

                                if (ticketData.length > 0) {
                                    opener = message.guild.members.cache.get(ticketData[0].opener_id);
                                    openDate = ticketData[0].opened_date;
                                    closeDate = ticketData[0].closed_date;
                                } else {
                                    opener = config.idBot;
                                    openDate = date.getDate;
                                    closeDate = date.getDate;
                                }

                                await message.channel.messages.fetch().then(async (messages) => {
                                    const output = messages.array().reverse().map(m => `${date.getDate} - ${m.author.tag}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`).join('\n');
                                    
                                    let result;
                                    try {
                                        result = await sourcebin.create([
                                            {
                                                name: ' ',
                                                content: output,
                                                languageId: 'text',
                                            }
                                        ], {
                                            title: `Transcription du salon ${message.channel.name}`,
                                            description: ' ',
                                        });
                                    } catch {
                                        return console.log('Erreur lors de la transcription.');
                                    }
                                    
                                    const transcriptDone = new MessageEmbed()
                                        .setTitle(message.channel.name)
                                        .addFields(
                                            { name: 'Ouverture du ticket', value: openDate, inline: true},
                                            { name: 'Fermeture du ticket', value: closeDate, inline: true},
                                            { name: 'Transcription', value: `[\`📄 Voir\`](${result.url})`}
                                        )
                                        .setColor('GREEN');
                                    const chanTranscript = client.channels.cache.get(config.idChannelTranscript);
                                    chanTranscript.send(transcriptDone);
                                    opener.send(transcriptDone);
                                });

                                message.channel.delete();
                            } else {
                                const notDeleted = new MessageEmbed().setDescription(`Le ticket n'a pas été clôturé.`).setColor('BLUE')
                                message.channel.send(notDeleted);
                                message.reactions.removeAll()
                                    .catch(error => console.error('Impossible de supprimer les réactions :', error));
                            }

                        })
                        .catch(collected => {
                            const cmdTimeout = new MessageEmbed()
                                .setTitle('Délai dépassé.')
                                .setDescription(`Le ticket n'a pas été clôturé.`)
                                .setColor('ORANGE');
                            message.channel.send(cmdTimeout);
                        });
                })
        } else {
            const doNotDelete = new MessageEmbed()
                .setDescription(`La commande 'close' ne s'utilise que pour des tickets !`)
                .setColor('RED');
            return message.channel.send(doNotDelete);
        };
	},
};