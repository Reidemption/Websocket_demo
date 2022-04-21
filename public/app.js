var url = location.origin.replace(/^http/, "ws");

let app = new Vue({
  el: "#app",
  data: {
    socket: null,
    image: null,
    player1: false,
    player2: false,
    win_message: "",
    guess: "",
    player_cap_reached: false,
    players: 0,
    guess_collection: [],
  },
  created: function () {
    this.connectSocket();
    this.getPhoto();
  },
  methods: {
    connectSocket: function () {
      this.socket = new WebSocket(`${url}`);
      this.socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.type === "player_cap_reached") {
          app.player_cap_reached = true;
        } else if (data.type === "player_cap_available") {
          app.player_cap_reached = false;
        } else if (data.type === "win") {
          app.win_message = data.message;
          console.log("Guesses: " + app.guess_collection);
          app.guess_collection = [];
          app.getPhoto();
        } else if (data.type === "end") {
          app.win_message = "";
          app.guess = "";
          app.players = 0;
          app.player_cap_reached = false;
        } else if (data.type === "guess") {
          app.guess_collection.push(data.guess);
        }
      };
    },
    getPhoto: function () {
      fetch(
        `https://api.unsplash.com/photos/random/?client_id=FtkPOyktCA5Vkkd_zFsTnJGTUmsDXiL0dceFqtFDWjU`
      ).then(function (response) {
        response.json().then(function (data) {
          console.log(data.urls.description);
          app.image = data.urls.small;
        });
      });
    },
    imageGuess: function () {
      this.socket.send(
        JSON.stringify({
          type: "guess",
          player: app.player,
          guess: app.guess,
        })
      );
      app.guess = "";
    },
  },
});
