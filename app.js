const util = require("util");

const fs = require("fs");
const app = require("express")();

let options = {};
let https = null;
try {
  options = {
    key: fs.readFileSync("./certs/privkey7.pem"),
    cert: fs.readFileSync("./certs/fullchain7.pem"),
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

  gameRoom.on("reconnectSocket", (lobby) => {
    gameRoom.join(lobby.lobby);
    console.log("reconnectSocket: lobby");
    console.log(lobby.lobby);
    console.log("reconnectSocket: ownlobby");
    console.log(lobby.ownLobby);
    console.log("reconnectSocket: playersUpdated");
    console.log(io.sockets.adapter.rooms[lobby.lobby].players);
    console.log("reconnectSocket: nextTurn");
    io.sockets.in(lobby.ownLobby).emit("popUpUpdated", {popUpOpen : io.sockets.adapter.rooms[lobby.lobby].popUpOpen});
    io.sockets.in(lobby.ownLobby).emit("playersUpdated", io.sockets.adapter.rooms[lobby.lobby].players);
    io.sockets.in(lobby.ownLobby).emit("rulesetUpdated", io.sockets.adapter.rooms[lobby.lobby].ruleset);
    io.sockets.in(lobby.ownLobby).emit("nextTurn", io.sockets.adapter.rooms[lobby.lobby].players);
  });

  gameRoom.on("joinLobby", (lobby) => {
    console.log("joinLobby: lobby");
    console.log(lobby);
    
    gameRoom.join(lobby);
    gameRoom.emit("lobbyJoined", lobby);
    io.sockets.in(lobby).emit("playersUpdated", io.sockets.adapter.rooms[lobby].players);
    io.sockets.in(lobby).emit("rulesetUpdated", io.sockets.adapter.rooms[lobby].ruleset);
  });

  gameRoom.on("startGame", (lobby) => {
    io.sockets.adapter.rooms[lobby].gameStarted = true;
    io.sockets.in(lobby).emit("gameStarted");
  });

  // Players
  gameRoom.on("addPlayerToSocket", (newPlayer) => {
    const lobby = newPlayer.lobby;
    const ownLobby = newPlayer.ownLobby;
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
    let error = false;
    players.forEach((player) => {
      if (player.color === newPlayer.newPlayer.color) {
        io.sockets.in(ownLobby).emit("playersNotUpdated", newPlayer.newPlayer.color);
        error = true;
      }
    });
    if (error) {
      return;
    }
    const newPlayers = players;

    newPlayer.newPlayer.id = players.length;

    newPlayers.push(newPlayer.newPlayer);
    players = newPlayers;
    io.sockets.adapter.rooms[lobby].players = players;
    io.sockets.in(lobby).emit("playersUpdated", players);
    io.sockets.in(ownLobby).emit("goToNewGame");
  });

  gameRoom.on("getPlayerFromSocket", (lobby) => {
    io.sockets.in(lobby).emit("playersUpdated", io.sockets.adapter.rooms[lobby].players);
  });

  gameRoom.on("getUpdate", (lobby) => {
    io.sockets.in(lobby.ownLobby).emit("gotUpdate", io.sockets.adapter.rooms[lobby.lobby].players);
  });

  // Ruleset
  gameRoom.on("setRulesetToSocket", (ruleset) => {
    const lobby = ruleset.lobby;
    io.sockets.adapter.rooms[lobby].ruleset = ruleset.ruleset;

    io.sockets.in(lobby).emit("rulesetUpdated", io.sockets.adapter.rooms[lobby].ruleset);
  });
  // PopUp
  gameRoom.on("updatePopUpOpen", (lobby) => {
    io.sockets.in(lobby).emit("popUpUpdated", {popUpOpen : io.sockets.adapter.rooms[lobby].popUpOpen});
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
    const random = Math.random();
    io.sockets.adapter.rooms[lobby].popUpOpen = true;
    io.sockets.in(lobby).emit("popUpUpdated", { popUpOpen: io.sockets.adapter.rooms[lobby].popUpOpen, random });
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

    io.sockets.adapter.rooms[lobby].players = players;

    io.sockets.in(lobby).emit("nextTurn", players);
  });
});
