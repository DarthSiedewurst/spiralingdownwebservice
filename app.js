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

let lobbyName = "";
let Players = [];

const io = require("socket.io").listen(server);
io.on("connection", (gameRoom) => {
  console.log("Connected");

  gameRoom.on("joinLobby", (lobby) => {
    console.log("Lobby Joined: " + lobby);

    lobbyName = lobby;

    gameRoom.join(lobby);
    io.in(lobby).emit("lobbyJoined", "You have sucessfully joined: " + lobby);
    gameRoom.on("addPlayerToSocket", (payload) => {
      const newPlayers = Players;
      newPlayers.push(payload.newPlayer);
      Players = newPlayers;
      console.log(payload.lobby);
      io.in(payload.lobby).emit("playersUpdated", Players);
    });
  });
});
