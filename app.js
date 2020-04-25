const fs = require('fs');
const options = {
  key: fs.readFileSync('/usr/local/psa/var/modules/letsencrypt/etc/archive/spiralingdown.de/privkey1.pem'),
  cert: fs.readFileSync('/usr/local/psa/var/modules/letsencrypt/etc/archive/spiralingdown.de/fullchain1.pem'),
};
/* const options = {
  key: fs.readFileSync('../SSL/privkey1.pem'),
  cert: fs.readFileSync('../SSL/cert1.pem'),
  ca: fs.readFileSync('../SSL/chain1.pem'),
}; */
const Express = require('express')();
//const Https = require('http').Server(options, Express);
const Https = require('https').Server(Express, options);
const Socketio = require('socket.io')(Https, { origins: 'http://localhost:8080' });

let testMessage = 'Das ist ein Test';

Socketio.on('connection', (socket) => {
  socket.emit('testMessage', testMessage);
});

Https.listen(3000, () => {
  console.log('listening at :3000...');
});
