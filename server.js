const express = require('express');
const server = express();

server.get('/', (req, res) => {
	res.send('Le bot est en vie !');
});

function keepAlive() {
	server.listen(8080, () => {
		console.log('Le serveur est prêt !');
	});
}

module.exports = keepAlive;