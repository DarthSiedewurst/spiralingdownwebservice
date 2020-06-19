const util = require("util");

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
io.sockets.adapter.rooms.ruleset = "";
io.sockets.adapter.rooms.popUpOpen = false;
io.sockets.adapter.rooms.gameStarted = false;

io.sockets.on("connection", (gameRoom) => {
  console.log("Connected");

  gameRoom.on("joinLobby", (lobby) => {
    console.log("Lobby Joined: " + lobby);

    gameRoom.join(lobby);
    gameRoom.emit("lobbyJoined", "You have sucessfully joined: " + lobby);
    io.sockets.in(lobby).emit("playersUpdated", io.sockets.adapter.rooms[lobby].players);
    io.sockets.in(lobby).emit("rulesetUpdated", io.sockets.adapter.rooms[lobby].ruleset);

    gameRoom.on("startGame", () => {
      io.sockets.adapter.rooms[lobby].gameStarted = true;
      io.sockets.in(lobby).emit("gameStarted");
    });

    // Players
    gameRoom.on("addPlayerToSocket", (newPlayer) => {
      const lobby = newPlayer.lobby;
      let players = [];

      if (io.sockets.adapter.rooms.gameStarted) {
        /* const errorMessage = "Spiel ist schon im Gange";
        io.sockets.in(lobby).emit("error", errorMessage); */
        gameRoom.leave(lobby);
        return;
      }

      if (io.sockets.adapter.rooms[lobby].players !== undefined) {
        players = io.sockets.adapter.rooms[lobby].players;
      }
      const newPlayers = players;

      newPlayers.push(newPlayer.newPlayer);
      players = newPlayers;
      io.sockets.adapter.rooms[lobby].players = players;
      io.sockets.in(lobby).emit("playersUpdated", players);
    });

    gameRoom.on("getPlayerFromSocket", (lobby) => {
      io.sockets.in(lobby).emit("playersUpdated", io.sockets.adapter.rooms[lobby].players);
    });

    // Ruleset
    gameRoom.on("setRulesetToSocket", (ruleset) => {
      const lobby = ruleset.lobby;
      io.sockets.adapter.rooms[lobby].ruleset = ruleset.ruleset;

      io.sockets.in(lobby).emit("rulesetUpdated", io.sockets.adapter.rooms[lobby].ruleset);
    });
    // PopUp
    gameRoom.on("updatePopUpOpen", (lobby) => {
      io.sockets.in(lobby).emit("popUpUpdated", io.sockets.adapter.rooms[lobby].popUpOpen);
    });
    gameRoom.on("okClicked", (lobby) => {
      io.sockets.in(lobby).emit("okHasBeenClicked");
      io.sockets.adapter.rooms[lobby].popUpOpen = false;
    });
    gameRoom.on("showRuleInSocket", (id) => {
      const lobby = id.lobby;
      io.sockets.in(lobby).emit("ruleOpened", {
        id: id.id,
        players: io.sockets.adapter.rooms[lobby].players,
      });
      io.sockets.adapter.rooms[lobby].popUpOpen = true;
      io.sockets.in(lobby).emit("popUpUpdated", io.sockets.adapter.rooms[lobby].popUpOpen);
    });
    // Dice
    gameRoom.on("moveInSocket", (payload) => {
      const lobby = payload.lobby;
      let players = io.sockets.adapter.rooms[lobby].players;

      players[payload.playerId].tile = players[payload.playerId].tile + payload.roll;
      if (players[payload.playerId].tile > 72) {
        players[payload.playerId].tile = 72;
      }
      io.sockets.adapter.rooms[lobby].players = players;

      io.sockets.in(lobby).emit("diceWasRolled", { roll: payload.roll, playerId: payload.playerId, players });
    });

    gameRoom.on("newActivePlayer", (lobby) => {
      let players = io.sockets.adapter.rooms[lobby].players;

      let id = 0;
      players.forEach((element) => {
        if (element.activeTurn) {
          id = element.id;
        }
      });

      players[id].activeTurn = false;
      if (id < players.length - 1) {
        players[id + 1].activeTurn = true;
      } else {
        players[0].activeTurn = true;
      }

      io.sockets.in(lobby).emit("nextTurn", players);
    });
  });
});
