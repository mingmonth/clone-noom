import http from "http";
// import WebSocket from "ws";
// import SocketIO from "socket.io";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);
// app.listen(3000, handleListen);

const httpServer = http.createServer(app);
// const wsServer = SocketIO(httpServer);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(wsServer, {
  auth: false,
});

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anonymous";
  socket.onAny((event) => {
    console.log(wsServer.sockets.adapter);
    console.log(`Socket Event:${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    // console.log(socket.rooms);
    // console.log(roomName);
    socket.join(roomName.payload);
    // console.log(socket.rooms);
    done();
    socket
      .to(roomName.payload)
      .emit("welcome", socket.nickname, countRoom(roomName.payload));
    wsServer.sockets.emit("room_change", publicRooms());
    // setTimeout(() => {
    //   done();
    // }, 3000);
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach(
      (room) =>
        socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1),
      socket.nickname
    );
  });

  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});
// const wss = new WebSocket.Server({ server });

// function handleConnection(socket) {
//   console.log(socket);
// }

// fake database
// const sockets = [];

// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "Anonymous";
//   console.log("Connected to Browser");
//   socket.on("close", () => console.log("Disconnected from the Browser!!"));
//   socket.on("message", (msg) => {
//     // console.log(msg.toString("utf8"));
//     // socket.send(msg.toString("utf8"));
//     const message = JSON.parse(msg.toString("utf8"));
//     console.log(message);
//     switch (message.type) {
//       case "new_message":
//         sockets.forEach((aSocket) =>
//           aSocket.send(`${socket.nickname}:${message.payload}`)
//         );
//         break;
//       case "nickname":
//         console.log(message.payload);
//         socket["nickname"] = message.payload;
//         break;
//       default:
//         console.log("default");
//     }
//   });
//   //   socket.send("welcome to chat!!");
// });

httpServer.listen(3000, handleListen);
