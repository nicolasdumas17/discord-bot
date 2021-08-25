const config = require('./config.json');
const keepAlive = require('./server');
const { Client, Collection, Intents } = require('discord.js');
const client = new Client({ disableMentions: 'everyone', partials: ['MESSAGE', 'CHANNEL', 'REACTION'], ws: { intents: Intents.ALL } });

/*
Essayer ça :
const client = new Client({ disableMentions: 'everyone', partials: ['MESSAGE', 'CHANNEL', 'REACTION'], 
    intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_PRESENCES, 
        Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGE_TYPING, 
        Intents.FLAGS.DIRECT_MESSAGES ] });

ATTENTION : Le getDate donne 2heures de moins !!
*/

client.commands = new Collection();
client.aliases = new Collection();

['command', 'event'].forEach(controller => {
	require(`./controllers/${controller}`)(client);
});

keepAlive();
client.login(config.token);