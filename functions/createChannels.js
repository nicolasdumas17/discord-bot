const { MessageEmbed } = require('discord.js');
const config = require('../config.json');
const mysql = require('../database/mysql.js');

exports.createChannels = (message, member, discord_id, discord_name, category_name) => {
    message.guild.roles.create({
        data: {
            name: discord_name,
            color: 'BLUE',
        },
        reason: `Création d'un rôle spécifique au créateur.`,
    })
    .then(role => {
        const roleCreated = new MessageEmbed().setDescription(`Le rôle ${discord_name} a été créé et assigné.`).setColor('GREEN');
        message.channel.send(roleCreated);

        member.roles.add(role);
        /*
        * Create a new category with creator's name (or another word)
        * Create multiple channels in this category
        */
        message.guild.channels.create(category_name, {
                type: 'category',
                position: 1,
                permissionOverwrites: [
                    {
                        id: config.idServer,
                        deny: ['VIEW_CHANNEL']
                    },
                    {
                        id: role.id,
                        allow: ['VIEW_CHANNEL']
                    }
                ]
        })
            .then(catParent => {
                mysql.update('users', `category_id=${catParent.id}, role_id=${role.id}`, `discord_id=${discord_id}`)
                
                message.guild.channels.create('Support', {
                    type: 'text',
                    parent: catParent,
                    permissionOverwrites: [
                        {
                            id: config.idServer,
                            deny: ['VIEW_CHANNEL','SEND_MESSAGES'],
                        }
                    ]
                });
                message.guild.channels.create('General', {
                    type: 'text',
                    parent: catParent,
                });
                message.guild.channels.create('Bugs', {
                    type: 'text',
                    parent: catParent,
                });
                message.guild.channels.create('Boutique', {
                    type: 'text',
                    parent: catParent,
                });
                message.guild.channels.create('Release', {
                    type: 'text',
                    parent: catParent,
                });
                const chanCreated = new MessageEmbed().setDescription('Les salons ont été créés.').setColor('GREEN');
                message.channel.send(chanCreated);
            })
            .catch(console.error);

    })
    .catch(console.error);
};