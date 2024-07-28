const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Replace with your frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "*", // Replace with your frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

// Add a simple GET request
app.get("/", (req, res) => {
  res.send("Server is running!");
});

let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  if (waitingPlayer) {
    const gameRoom = `game-${waitingPlayer.id}-${socket.id}`;
    socket.join(gameRoom);
    waitingPlayer.join(gameRoom);

    const playerColor = Math.random() < 0.5 ? "white" : "black";
    const opponentColor = playerColor === "white" ? "black" : "white";

    waitingPlayer.emit("game_start", { color: playerColor });
    socket.emit("game_start", { color: opponentColor });

    io.to(gameRoom).emit("opponent_joined", {});

    waitingPlayer = null;
  } else {
    waitingPlayer = socket;
  }

  socket.on("make_move", (data) => {
    console.log(`Player ${socket.id} made a move: ${JSON.stringify(data)}`);
    const gameRoom = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (gameRoom) {
      socket.to(gameRoom).emit("opponent_move", data);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }
  });
});

server.listen(3001, () => {
  console.log("Server is running on port 3001");
});
