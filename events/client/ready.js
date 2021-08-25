const config = require('../../config.json');
const prefix = config.prefix;

module.exports = async (client) => {
	console.log(`Connecté avec ${client.user.tag}`);
	console.log('Préfixe :', prefix);

	// client.commands.forEach(cmd => {
	// 	if (cmd.launchOnReady) {
	// 		const command = client.commands.get(cmd.name);
	// 		command.run(client);
	// 	}
	// })
};