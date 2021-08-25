const { MessageEmbed } = require('discord.js');
const mysql = require('../../database/mysql.js');
const config = require('../../config.json');
const date = require('../../functions/getDate.js');

module.exports = {
	name: 'newCreator',
	category: 'Tickets',
	description: 'Création d\'un nouveau ticket-[C,S]xxxx depuis les salons "Support" des créateurs.',
	aliases: ['onReady'],
	usage: 'Cliquer sur la réaction d\'un channel "Support"',
	userperms: [],
	botperms: [],
    launchOnReady: true,
	run: async (client) => {
        let supportChannels = [];
        
        try {
            let channels = client.channels.cache.array();
            for (const channel of channels) {
                if (channel.name === 'support') {
                    supportChannels.push(channel.id);
                }
            }
        } catch {
            console.error
        }

        supportChannels.forEach(chan => {
            const channel = client.channels.cache.get(chan);

            const newTicket = new MessageEmbed()
                .setTitle(`Besoin d'aide ?`)
                .setDescription(`N'hésites pas à ouvrir un ticket concernant l'un de mes produits disponible sur FiveMods en cliquant sur 🎫.`)
                .setColor('BLUE');
            const filter = (reaction, user) => {
                return ['🎫'].includes(reaction.emoji.name) && !user.bot;
            };

            /*
            * Delete messages on all channels
            */
            channel.bulkDelete(5)
                .then(messages => console.log(`Messages supprimés du salon ${channel.name} : ${messages.size}`))
                .catch(console.error);

            /*
            * Send message with reaction to create a ticket
            */
            channel.send(newTicket)
                .then(message => {
                    message.react('🎫');
                    const collector = message.createReactionCollector(filter, {errors: ['time']});

                    collector.on('collect', async (reaction, reactionCollector) => {
                        const ticketData = await mysql.read('users', 'support', `category_id=${channel.parentID}`);
                        let ticketPrefix = '';
                        let ticketType = '';
                        
                        try {
                            const support = ticketData[0].support;
                            if(support === 0) {
                                ticketPrefix = 'S';
                                ticketType = 'Support';
                            } else {
                                ticketPrefix = 'C';
                                ticketType = 'Createur';
                            }
                        } catch {
                            const category = client.channels.cache.get(channel.parentID);
                            const categoryName = category.name;
                            console.error(`Le créateur ${categoryName} est inconnu dans la base de données.`)
                        }

                        
                        const ticketCounter = await mysql.read('tickets', 'COUNT(*) + 1 AS ticketNum', `ticket_type='${ticketType}'`);
                        const ticketNum = ticketCounter[0].ticketNum;
                        const ticketName = 'Ticket-' + ticketPrefix + ticketNum; 

                        const memberId = reactionCollector.id;
                        const member = message.guild.members.cache.get(memberId);

                        message.guild.channels.create(ticketName, {
                            type: 'text',
                            parent: config.idCategorySupport,
                            permissionOverwrites: [
                                {
                                    id: config.idServer,
                                    deny: ['VIEW_CHANNEL'],
                                }
                            ]
                        })
                        .then(ticket => {
                            mysql.create('tickets', 
                                'ticket_id, ticket_type, ticket_number, opener_id, opened_date', 
                                `${ticket.id},'${ticketType}',${ticketNum},'${member.user.id}','${date.getDate}'`
                            );
                            
                            const newTicket = new MessageEmbed()
                                .setTitle(ticketName)
                                .setDescription(member.toString() + ' votre ticket est ouvert. Merci de détailler au maximum votre demande, nous allons y répondre dans les plus brefs délais. Pour clore ce ticket tapez la commande !close')
                                .setColor('GREEN');
						    ticket.send(newTicket);
                        })
                        .catch(console.error);
                    });

                    collector.on('end', collected => {
                        console.log(`Nombre de tickets créés : ${collected.size}`);
                    });
                })
                .catch(console.error);
        });
    }
}