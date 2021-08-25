const { MessageEmbed } = require('discord.js');
const config = require('../../config.json');
const mysql = require('../../database/mysql.js');
const date = require('../../functions/getDate.js');
const newChans = require('../../functions/createChannels.js');

module.exports = {
	name: 'add-creator',
	category: 'Developpers',
	description: 'Ajouter un créateur.',
	aliases: ['acrea', 'add'],
	usage: '!add-creator <NomCategorie> <DiscordID>',
	userperms: ['ADMINISTRATOR'],
	botperms: [],
	launchOnReady: false,
	run: async (client, message, args) => {
        if(args.length !== 2) {
			const numberArgs = new MessageEmbed().setDescription(`La commande !add-creator nécessite 2 arguments (la catégorie et l'id de l'utilisateur)`).setColor('ORANGE');
            return message.channel.send(numberArgs);
        }

        let category_name = args[0].toLocaleLowerCase();
        let discord_id = args[1];
        let added_by = message.author.username;
		
		const creaExists = await mysql.read('users','discord_name, removed',`discord_id=${discord_id}`);
		const creaUserName = creaExists[0].discord_name;
		const creaRemoved = creaExists[0].removed;

		let list = client.guilds.cache.get(config.idServer);

		list.members.fetch(discord_id)
			.then (member => {
				/*
				* Create a user in DB
				* Create a role named by creator's username
				* Assign the role to this creator
				*/
				if (creaExists.length === 1) {
					if (creaRemoved === 0) {
						const msgExists = new MessageEmbed()
							.setDescription(`${creaUserName} (ID ${discord_id}) existe déjà dans la base de données.`)
							.setColor('RED');
						return message.channel.send(msgExists);
					} else {
						const msgRemoved = new MessageEmbed()
							.setDescription(`${creaUserName} (ID ${discord_id}) est supprimé dans la base de données. Voulez-vous le ré-ajouter ?`)
							.setColor('BLUE');
						const filter = (reaction, user) => {
							return ['👍','👎'].includes(reaction.emoji.name) && user.id === message.author.id;
						}

						message.channel.send(msgRemoved)
							.then(message => {
								message.react('👍').then(() => message.react('👎'));
								message.awaitReactions(filter, {max: 1, time: 60000, errors: ['time']})
									.then(collected => {
										const reaction = collected.first();
										
										if (reaction.emoji.name === '👍') {
											newChans.createChannels(message, member, discord_id, creaUserName, category_name);

											const reAdd = new MessageEmbed()
												.setDescription(`${creaUserName} a bien été ré-ajouté.`)
												.setColor('GREEN');
											message.channel.send(reAdd);

											mysql.update('users', 'removed=0', `discord_id=${discord_id}`);
										} else {
											const notReAdd = new MessageEmbed()
												.setDescription(`${creaUserName} n'a pas été ré-ajouté.`)
												.setColor('BLUE');
											message.channel.send(notReAdd);
										}

										message.reactions.removeAll()
											.catch(error => console.error('Impossible de supprimer les réactions :', error));
										})
									.catch(collected => {
										const cmdTimeout = new MessageEmbed()
											.setTitle('Délai dépassé.')
											.setDescription(`Le statut de ${creaUserName} n'a pas été modifié.`)
											.setColor('ORANGE');
										message.channel.send(cmdTimeout);
									});
							})
							.catch(console.error);
					}
				} else {
					let discord_name = member.user.username;
			
					mysql.create('users', 
						'discord_id, discord_name, category_name, creation_date, added_by', 
						`${discord_id},'${discord_name}','${category_name}', '${date.getDate}','${added_by}'`);

					newChans.createChannels(message, member, discord_id, discord_name, category_name);
				}
		}).catch(error => {
			const creaNotFound = new MessageEmbed().setDescription(`L'ID ${discord_id} ne correspond à aucun utilisateur du serveur.`).setColor('RED');
			message.channel.send(creaNotFound);
			console.log(error);
		});
	},
};