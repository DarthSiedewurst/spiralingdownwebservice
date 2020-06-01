var fs = require("fs");
var app = require("express")();
var options = {};
var https = null;
try {
  options = {
    key: fs.readFileSync("./certs/privkey1.pem"),
    cert: fs.readFileSync("./certs/fullchain1.pem"),
  };
  https = require("https");
} catch (e) {
  console.log(e);
  console.log("Zertifikate nicht erreichbar");
  https = require("http");
}

var server = https.createServer(options, app);
server.listen(3000);

var io = require("socket.io").listen(server);

let testMessage = "Das ist kein Test";

io.sockets.on("connection", (gameRoom) => {
  console.log("Connected");

  gameRoom.on("joinLobby", (lobby) => {
    console.log("Lobby Joined: " + lobby);

    gameRoom.join(lobby);
    return gameRoom.in(lobby).emit("lobbyJoined", "You have sucessfully joined: " + lobby);
  });
});

app.get("/", (request, response) => {
  console.log("app.get");
});
