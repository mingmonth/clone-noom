import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);
// app.listen(3000, handleListen);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// function handleConnection(socket) {
//   console.log(socket);
// }

// fake database
const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "Anonymous";
  console.log("Connected to Browser");
  socket.on("close", () => console.log("Disconnected from the Browser!!"));
  socket.on("message", (msg) => {
    // console.log(msg.toString("utf8"));
    // socket.send(msg.toString("utf8"));
    const message = JSON.parse(msg.toString("utf8"));
    console.log(message);
    switch (message.type) {
      case "new_message":
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname}:${message.payload}`)
        );
        break;
      case "nickname":
        console.log(message.payload);
        socket["nickname"] = message.payload;
        break;
      default:
        console.log("default");
    }
  });
  //   socket.send("welcome to chat!!");
});

server.listen(3000, handleListen);
