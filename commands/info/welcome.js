const { MessageEmbed } = require('discord.js');
const config = require('../../config.json');

module.exports = {
	name: 'welcome',
	category: 'Info',
	description: 'Ajout du rôle membre.',
	aliases: ['onReady'],
	usage: 'Cliquer sur la réaction dans le channel "Bienvenue".',
	userperms: ['ADMINISTRATOR'],
	botperms: [],
    launchOnReady: true,
	run: async (client) => {
        const channel = client.channels.cache.get(config.idChannelWelcome);

        const msgToAddMember = new MessageEmbed()
            .setDescription('Pour obtenir le rôle "Membre", cliquez sur la réaction : ✅')
            .setColor('BLUE');
        const filter = (reaction, user) => {
            return ['✅'].includes(reaction.emoji.name) && !user.bot;
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
        channel.send(msgToAddMember)
            .then(message => {
                message.react('✅');
                const collector = message.createReactionCollector(filter, {errors: ['time']});

                collector.on('collect', (reaction, reactionCollector) => {
                    const memberId = reactionCollector.id;
                    const member = message.guild.members.cache.get(memberId);
                    member.roles.add(config.idRoleMember);
                    member.send('Vous avez maintenant le rôle "Membre" !');
                });

                collector.on('end', collected => {
                    console.log(`Nombre de membres ajoutés : ${collected.size}`);
                });
            })
            .catch(console.error);
    }
}