const { validatePermissions } = require('../../functions/permissions.js');
const config = require('../../config.json');

module.exports = async (client, message) => {
    const prefix = config.prefix;

	if (message.author.bot || !message.guild) return;

	if (message.content.match(`^[\.\?\$]`)) {
		message.channel.send(`Le préfixe de ${message.guild.name} est \`${prefix}\``);
	}

	if(!message.content.startsWith(prefix)) return;
	if (!message.member) message.member = await message.guild.fetchMember(message);

	const args = message.content.slice(prefix.length).split(/ +/g);
	const cmd = args.shift().toLowerCase();

	if (cmd.length === 0) return;

	const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));

	if (command) {
		if (command.userperms.length > 0 || command.botperms.length > 0) {
			if (typeof command.userperms === 'string') {
				command.userperms = command.userperms.split();
				validatePermissions(command.userperms);
			}

			for(const permission of command.userperms) {
				if(permission === 'BOT_OWNER' && message.member.id !== BOT_OWNER) {
					return;
				}
				else if(!message.member.hasPermission(permission)) {
					return message.channel.send(
						`Permission insuffisante. La permission \`${permission}\` est requise pour exécuter cette commande.`,
					);
				}
			}

			if(typeof command.botperms === 'string') {
				command.botperms = command.botperms.split();
				validatePermissions(command.botperms);
			}

			for(const permission of command.botperms) {
				if (!message.guild.me.hasPermission(permission)) {
					return message.channel.send(
						`Je n'ai pas la permission suffisante. J'ai besoin de la permission : \`${permission}\`.`,
					);
				}
			}
		}
		command.run(client, message, args, prefix);
	}
};