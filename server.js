const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 8080;

var server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

let player1 = null;
let player2 = null;
let player1_guesses = [];
let player2_guesses = [];

const wss = new WebSocket.Server({ server });
wss.on("connection", function connection(ws) {
  if (player1 == null) {
    player1 = ws;
    console.log("Player 1 connected");
    player1.on("close", function close() {
      player1 = null;
      player1_guesses = [];
      player2_guesses = [];
      console.log("Player 1 disconnected");
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "player_cap_available" }));
        }
      });
    });

    player1.on("message", function incoming(message) {
      const data = JSON.parse(message);
      if (data.type === "guess") {
        let returnValue;
        if (player2_guesses.includes(data.guess)) {
          player1_guesses.push(data.guess);
          console.log(
            "Guesses match up from Player 1 and Player 2\n Player1 Guesses: " +
              player1_guesses +
              "\n Player2 Guesses: " +
              player2_guesses
          );
          returnValue = {
            type: "win",
            message: "You and your partner guessed the same! You win!",
          };
          player1_guesses = [];
          player2_guesses = [];
        } else {
          player1_guesses.push(data.guess);
          returnValue = { type: "guess", guess: data.guess };
        }
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(returnValue));
          }
        });
      }
    });
  } else if (player2 == null) {
    player2 = ws;
    console.log("Player 2 connected");

    player2.on("close", function close() {
      player2 = null;
      player1_guesses = [];
      player2_guesses = [];
      console.log("Player 2 disconnected");
      // wss.clients.forEach(function each(client) {
      //   if (client.readyState === WebSocket.OPEN) {
      //     client.send(JSON.stringify({ type: "player_cap_available" }));
      //   }
      // });
    });
    player2.on("message", function incoming(message) {
      const data = JSON.parse(message);
      if (data.type === "guess") {
        let returnValue;
        if (player1_guesses.includes(data.guess)) {
          player2_guesses.push(data.guess);
          console.log(
            "Guesses match up from Player 2 and Player 1\n Player2 Guesses: " +
              player2_guesses +
              "\n Player1 Guesses: " +
              player1_guesses
          );
          returnValue = {
            type: "win",
            message: "You and your partner guessed the same! You win!",
          };
          player1_guesses = [];
          player2_guesses = [];
        } else {
          player2_guesses.push(data.guess);
          returnValue = { type: "guess", guess: data.guess };
        }
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(returnValue));
          }
        });
      }
    });
  } else if (player2) {
    wss.clients.forEach(function each(client) {
      console.log("sent player cap reached");
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "player_cap_reached" }));
      }
    });
  }
});

if (!player1 || !player2) {
  wss.clients.forEach(function each(client) {
    console.log("sent player cap available");
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "player_cap_available" }));
    }
  });
}
