module.exports = async (client, channel) => {
    if(channel.name === 'support') {
        const cmd = 'newCreator';
        const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));
        
        command.run(client, channel);
    };
};