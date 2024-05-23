let express = require('express'); 
let app = express();
let server = app.listen(process.env.PORT || 3000);
app.use(express.static('public'));
console.log('server running')
let socket = require('socket.io');
let io = socket(server, {
  //this allows external websites to connect
  cors: {
    origin: true
  },
  //this allows older socket versions to connect
  allowEIO3: true
});

io.sockets.on('connection', newConnection);
//don't change anything above this line

let entered = [];

function newConnection(socket){
  
   socket.emit("connected");
  
  // update new users about the count
  io.emit("count", entered.length);
  

  socket.on("attemptEnter", () => {
    if (entered.length < 2){
      entered.push(socket.id);
      socket.emit("enterAccepted");
      sendCount();
    }
  });
  
  socket.on("mousemove", (data) => {
    socket.broadcast.emit("othermove", data);
  });
  
  // disconnect them and update the num entered IF they're in it
  socket.on("disconnect", () => {
    if (entered.includes(socket.id)){
      entered.splice(entered.indexOf(socket.id),1);
    }
    sendCount();
  });
  
  // disconnect them and update the num entered IF they're in it
  socket.on("timeOver", () => {
    entered = [];
    sendCount();
  });

}

let sendCount = function(){
  io.emit("count", entered.length);
}


//Server needs to know: how many people are in room? needs to be two max.
// Where are the cursors at a give moment?