const fs = require("fs");
const app = require("express")();

let options = {};
let https = null;
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

const server = https.createServer(options, app);
server.listen(3000);

let Players = [];

const io = require("socket.io").listen(server);
io.sockets.adapter.rooms.players = [];

io.sockets.on("connection", (gameRoom) => {
  console.log("Connected");

  gameRoom.on("joinLobby", (lobby) => {
    console.log("Lobby Joined: " + lobby);
    gameRoom.adapter.rooms.lobby = lobby;

    gameRoom.join(lobby);
    gameRoom.emit("lobbyJoined", "You have sucessfully joined: " + lobby);

    gameRoom.on("addPlayerToSocket", (newPlayer) => {
      const lobby = gameRoom.adapter.rooms.lobby;
      let players = [];

      if (io.sockets.adapter.rooms[lobby].players !== undefined) {
        players = io.sockets.adapter.rooms[lobby].players;
      }
      const newPlayers = players;

      newPlayers.push(newPlayer);
      players = newPlayers;
      io.sockets.adapter.rooms[lobby].players = players;
      io.sockets.in(lobby).emit("playersUpdated", players);
    });

    gameRoom.on("getPlayerFromSocket", () => {
      io.sockets
        .in(gameRoom.adapter.rooms.lobby)
        .emit("playersUpdated", io.sockets.adapter.rooms[gameRoom.adapter.rooms.lobby].players);
    });
  });
});
