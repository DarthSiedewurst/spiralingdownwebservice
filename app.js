var fs = require('fs');
var app = require('express')();
var https = require('http');
var server = https.createServer(
  /*   {
    key: fs.readFileSync('./certs/privkey1.pem'),
    cert: fs.readFileSync('./certs/fullchain1.pem'),
  }, */
  app
);
server.listen(3000);

var io = require('socket.io').listen(server);

let testMessage = 'Das ist kein Test';

io.sockets.on('connection', (socket) => {
  socket.emit('testMessage', testMessage);
});

app.get('/', (request, response) => {
  console.log('app.get');
});
