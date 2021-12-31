const socket = io();

const welcome = document.getElementById("welcome");
const room = document.getElementById("room");
const nicknameForm = welcome.querySelector("#nickname");
const roomnameForm = welcome.querySelector("#roomname");

room.hidden = true;

let roomName;

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = "";
}

function handleNickNameSubmit(event) {
  event.preventDefault();
  const input = welcome.querySelector("#nickname input");
  socket.emit("nickname", input.value);
  input.value = "";
}

function showRoom() {
  //   console.log(`The bacekend says: `);
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;
  const msgForm = room.querySelector("#msg");
  //   const nameForm = room.querySelector("#name");
  msgForm.addEventListener("submit", handleMessageSubmit);
  //   nameForm.addEventListener("submit", handleNickNameSubmit);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = welcome.querySelector("#roomname input");
  socket.emit("enter_room", { payload: input.value }, showRoom);
  roomName = input.value;
  input.value = "";
}

roomnameForm.addEventListener("submit", handleRoomSubmit);
nicknameForm.addEventListener("submit", handleNickNameSubmit);

socket.on("welcome", (user) => {
  addMessage(`${user} joind!`);
});

socket.on("bye", (user) => {
  addMessage(`${user} left!`);
});

socket.on("new_message", addMessage);

socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});
