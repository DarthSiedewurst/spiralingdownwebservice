const fs = require('fs');
/* const options = {
  key: fs.readFileSync('/usr/local/psa/var/modules/letsencrypt/etc/archive/spiralingdownserver.de/privkey1.pem'),
  cert: fs.readFileSync('/usr/local/psa/var/modules/letsencrypt/etc/archive/spiralingdownserver.de/fullchain1.pem'),
}; */
//const options = { key: fs.readFileSync('letsencrypt.pem') };
const Express = require('express')();
//const Https = require('http').Server(options, Express);
const Http = require('http').Server(Express);
const Socketio = require('socket.io')(Http);

let testMessage = 'Das ist ein Test';

Socketio.on('connection', (socket) => {
  socket.emit('testMessage', testMessage);
});

Http.listen(3000, () => {
  console.log('listening at :3000...');
});
