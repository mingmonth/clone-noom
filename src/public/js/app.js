// import { WebSocketServer } from "ws";
// const { WebSocketServer } = require("ws");

const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");

const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted;
let cameraOff;
let roomName;
let myPeerConnection;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log(devices);
    const default_devices = devices.filter(
      (device) => device.deviceId === "default"
    );
    const cameras = devices.filter((device) => device.kind === "videoinput");
    console.log(cameras);
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      cameraSelect.appendChild(option);
    });
    default_devices.forEach((default_device) => {
      const option = document.createElement("option");
      option.value = default_device.deviceId;
      option.innerText = default_device.label;
      cameraSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}
// constraints
async function getMedia(deviceId) {
  const initialConstraints = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstraints
    );
    console.log(myStream);

    // audio true
    muteBtn.innerText = "Mute";
    muted = false;

    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

// getMedia();

function handleCameraClick() {
  console.log(myStream.getVideoTracks());
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

function handleMuteClick() {
  console.log(myStream.getAudioTracks());
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));

  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

async function handleCemeraChange() {
  console.log(cameraSelect.value);
  await getMedia(cameraSelect.value);
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCemeraChange);

// Welcome Form (join a room)
const welcome = document.getElementById("welcome");
welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

socket.on("welcome", async () => {
  console.log("someone joined");
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
  console.log(offer);
});

socket.on("offer", async (offer) => {
  console.log("received the offer");
  console.log(offer);
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  console.log(answer);
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});

socket.on("answer", (answer) => {
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
});

// RTC Code
function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("got ice candidate");
  console.log("send candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  const peerFace = document.getElementById("peerFace");
  console.log("got and event from my peer");
  console.log("Peer's Stream", data.stream);
  peerFace.srcObject = data.stream;
  console.log("My Stream", myStream);
}

socket.on("ice", (ice) => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});

// const welcome = document.getElementById("welcome");
// const room = document.getElementById("room");
// const nicknameForm = welcome.querySelector("#nickname");
// const roomnameForm = welcome.querySelector("#roomname");

// room.hidden = true;

// let roomName;

// function addMessage(message) {
//   const ul = room.querySelector("ul");
//   const li = document.createElement("li");
//   li.innerText = message;
//   ul.appendChild(li);
// }

// function handleMessageSubmit(event) {
//   event.preventDefault();
//   const input = room.querySelector("#msg input");
//   const value = input.value;
//   socket.emit("new_message", input.value, roomName, () => {
//     addMessage(`You: ${value}`);
//   });
//   input.value = "";
// }

// function handleNickNameSubmit(event) {
//   event.preventDefault();
//   const input = welcome.querySelector("#nickname input");
//   socket.emit("nickname", input.value);
//   input.value = "";
// }

// function showRoom() {
//   //   console.log(`The bacekend says: `);
//   welcome.hidden = true;
//   room.hidden = false;
//   const h3 = room.querySelector("h3");
//   h3.innerText = `Room ${roomName}`;
//   const msgForm = room.querySelector("#msg");
//   //   const nameForm = room.querySelector("#name");
//   msgForm.addEventListener("submit", handleMessageSubmit);
//   //   nameForm.addEventListener("submit", handleNickNameSubmit);
// }

// function handleRoomSubmit(event) {
//   event.preventDefault();
//   const input = welcome.querySelector("#roomname input");
//   socket.emit("enter_room", { payload: input.value }, showRoom);
//   roomName = input.value;
//   input.value = "";
// }

// roomnameForm.addEventListener("submit", handleRoomSubmit);
// nicknameForm.addEventListener("submit", handleNickNameSubmit);

// socket.on("welcome", (user, newCount) => {
//   const h3 = room.querySelector("h3");
//   h3.innerText = `Room ${roomName} (${newCount})`;
//   addMessage(`${user} joind!`);
// });

// socket.on("bye", (user, newCount) => {
//   const h3 = room.querySelector("h3");
//   h3.innerText = `Room ${roomName} (${newCount})`;
//   addMessage(`${user} left!`);
// });

// socket.on("new_message", addMessage);

// socket.on("room_change", (rooms) => {
//   const roomList = welcome.querySelector("ul");
//   roomList.innerHTML = "";
//   if (rooms.length === 0) {
//     return;
//   }
//   rooms.forEach((room) => {
//     const li = document.createElement("li");
//     li.innerText = room;
//     roomList.append(li);
//   });
// });
