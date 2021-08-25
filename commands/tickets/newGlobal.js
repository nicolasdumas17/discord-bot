const { MessageEmbed, ReactionCollector } = require('discord.js');
const mysql = require('../../database/mysql.js');
const config = require('../../config.json');
const date = require('../../functions/getDate.js');

module.exports = {
	name: 'newGlobal',
	category: 'Tickets',
	description: 'Création d\'un nouveau ticket-[A,B,S]xxxx depuis le salon "Global".',
	aliases: ['onReady'],
	usage: 'Cliquer sur l\'une des réactions du channel "Global"',
	userperms: [],
	botperms: [],
	launchOnReady: true,
	run: async (client) => {
		const channel = client.channels.cache.get(config.idChannelGlobalSupport);
		const newTicket = new MessageEmbed()
			.setTitle(`Besoin d'aide ?`)
			.setDescription(`Notre équipe est à votre écoute et répondra dans les plus brefs délais à vos demandes. 
				Afin de qualifier au mieux celles-ci merci d'utiliser la réaction correspondante à votre problématique.`)
			.addFields(
				{ name: '\u200B', value: '\u200B' },
				{ name: '🎫 Support', value: `Pour toute demande liée à l'utilisation de contenu FiveMods (problème avec un script, mapping ne fonctionne pas)`, inline: true},
				{ name: '🛒 Boutique', value: `Pour toute demande liée directement à la boutique (achat impossible, article manquant, etc...)`, inline: true},
				{ name: '🔒 Administrateur', value: `Pour effectuer une remontée sur un comportement et/ou du contenu inapproprié sur Discord (salon ou utilisateur)`, inline: true},
			)
			.setColor('BLUE');
		const filter = (reaction, user) => {
			return ['🎫','🛒','🔒'].includes(reaction.emoji.name) && !user.bot;
		};

		/*
		* Delete messages on all channels
		*/
		channel.bulkDelete(5)
			.then(messages => console.log(`Messages supprimés du salon ${channel.name} : ${messages.size}`))
			.catch(console.error);

		/*
		* Send message with reactions to create a ticket
		*/
		channel.send(newTicket)
			.then(message => {
				message.react('🎫')
					.then(() => message.react('🛒'))
					.then(() => message.react('🔒'))
					.catch(console.error);

				const collector = message.createReactionCollector(filter, {errors: ['time']});
				
				collector.on('collect', async (reaction, reactionCollector) => {
					let ticketPrefix = '';
					let ticketType = '';

					switch(reaction.emoji.name) {
						case '🎫':
							ticketPrefix = 'S';
							ticketType = 'Support';
							break;
						case '🛒':
							ticketPrefix = 'B';
							ticketType = 'Boutique';
							break;
						case '🔒':
							ticketPrefix = 'A';
							ticketType = 'Administrateur';
							break;
						default:
							console.error(`Aucune réaction enregistré.`);
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
    }
}