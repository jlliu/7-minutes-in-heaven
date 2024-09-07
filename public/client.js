// uncomment the line below and put your socket events in here
let socket = io();
console.log(socket);

//example event listener
// socket.on('newMsgFromServer', function(data){
// 	  do something with data
// })

let doorButton = document.querySelector("#doorButton");
let door = document.querySelector(".door");
let heavenDiv = document.querySelector(".heaven");
let entered = false;
let othercursor = document.querySelector(".othercursor");

let body = document.querySelector("body");

let heavenMessage = document.querySelector(".message");
let timer = document.querySelector("#timer");

let otherEnteredEvent = new Event("otherEnteredEvent");

doorButton.addEventListener("click", function () {
  //decide to enter
  socket.emit("attemptEnter");
});

socket.on("connected", (count) => {
  body.style.display = "block";

  body.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 4000,
    iterations: 1,
    fill: "forwards",
  });
  window.setTimeout(function () {
    body.style.pointerEvents = "all";
  }, 3000);
});

socket.on("enterAccepted", (count) => {
  heavenDiv.style.opacity = 1;
  heavenDiv.style.pointerEvents = "all";
  heavenDiv.style.visibility = "visible";
  entered = true;
});

let timerStarted = false;
let interval;

let maxTime = 420000;
// let maxTime = 30000;

function msToTime(duration) {
  var seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60);

  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return minutes + ":" + seconds;
}

function leaveRoom() {
  othercursor.style.display = "none";
  heavenDiv.style.opacity = 0;
  heavenDiv.style.pointerEvents = "none";
  heavenDiv.style.visibility = "hidden";
}

// make sure everyone is kicked out properly!
socket.on("kickOut", () => {
  console.log("GETTING KICKED OUT");
  entered = false;
  leaveRoom();
  timerStarted = false;
  clearInterval(interval);
});

// update UI based on current count
socket.on("count", (count) => {
  console.log("receiving count: " + count);
  //update UI of heaven
  if (entered) {
    if (count >= 2) {
      othercursor.style.display = "block";
      heavenMessage.innerHTML = "someone is here with you";
      if (!timerStarted) {
        document.dispatchEvent(otherEnteredEvent);
        timerStarted = true;
        let startTime = new Date().getTime();
        interval = setInterval(function () {
          let newTime = new Date().getTime();
          // calculate 7 minutes minus difference
          let time = maxTime - (newTime - startTime);
          if (time <= 0) {
            //Kick everyone out!
            entered = false;
            console.log("entered is false");
            leaveRoom();
            timerStarted = false;
            clearInterval(interval);
            socket.emit("timeOver");
          }
          timer.innerHTML = msToTime(time);
        }, 50);
      }
    } else if (count == 1) {
      othercursor.style.display = "none";
      heavenMessage.innerHTML = "no one else is here yet";
      timer.innerHTML = "7:00";
      timerStarted = false;
      clearInterval(interval);
    }
  } else {
    leaveRoom();
    // update UI of waiting room
    if (count >= 2) {
      door.src = "door-close.png";
      doorButton.innerHTML = "heaven is occupied";
      doorButton.setAttribute("disabled", true);
    } else {
      door.src = "door-open.png";
      doorButton.innerHTML = "enter heaven";
      doorButton.removeAttribute("disabled");
    }
  }
});

socket.on("othermove", (data) => {
  othercursor.style.left = `${data.x}px`;
  othercursor.style.top = `${data.y}px`;
});

document.addEventListener("mousemove", function (e) {
  if (entered) {
    let x = e.clientX;
    let y = e.clientY;
    socket.emit("mousemove", { x: x, y: y });
  }
});

// setup clouds
for (var i = 0; i < 8; i++) {
  let cloud = document.createElement("img");
  cloud.src = "cloud.png";
  cloud.classList.add("cloud");
  cloud.style.left = "0px";
  if (i == 7) {
    // cloud.style.background = "blue";
    cloud.style.top = `${window.innerHeight / 2 - 40}px`;
  } else {
    cloud.style.top = `${-50 + Math.random() * (window.innerHeight + 100)}px`;
  }
  // cloud.style.animationDelay = `${-Math.random()*6}s`;
  // cloud.style.animationDuration = `${7+Math.random()*5}s`;
  cloud.animate(
    [
      // keyframes
      { transform: `translateX(-300px)` },
      { transform: `translateX(calc(100vw + 150px))` },
      // { transform: `translateX(${window.innerWidth+300}px)` },
    ],
    {
      // timing options
      duration: 40000 + Math.random() * 40000,
      // duration: `${7000+Math.random()*5000}`,
      delay: -Math.random() * 60000,
      iterations: Infinity,
    }
  );
  heavenDiv.appendChild(cloud);
}

// Reset after 10 minutes
let resetTime = 600;

function setIdle(cb, seconds) {
  var timer;
  var interval = seconds * 1000;
  function refresh() {
    clearInterval(timer);
    timer = setTimeout(cb, interval);
  }
  ["keypress", "click", "mousemove", "otherEnteredEvent"].forEach((event) =>
    document.addEventListener(event, refresh)
  );
  refresh();
}

setIdle(function () {
  location.href = "/";
}, resetTime);
