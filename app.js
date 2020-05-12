var fs = require('fs');
var app = require('express')();
var https = require('https');
var server = https.createServer(
  {
    key: fs.readFileSync('/usr/local/psa/var/modules/letsencrypt/etc/archive/spiralingdown.de/privkey1.pem'),
    cert: fs.readFileSync('/usr/local/psa/var/modules/letsencrypt/etc/archive/spiralingdown.de/fullchain1.pem'),
  },
  app
);
server.listen(3000);

var io = require('socket.io').listen(server);

let testMessage = 'Das ist ein Test';

io.sockets.on('connection', (socket) => {
  socket.emit('testMessage', testMessage);
});

app.get('/', (request, response) => {
  console.log('app.get');
});
