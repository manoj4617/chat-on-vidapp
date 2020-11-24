const express = require("express");
const mongoose = require('mongoose')
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/route')
const { requireAuth, checkUser } = require('./middleware/authMiddleware');

// Peer
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

//database connection
const dburi = 'mongodb+srv://manojadmin:Manoj4617@cluster0.qgcef.mongodb.net/videochat'
mongoose.connect(dburi, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
  .then((result) => server.listen(process.env.PORT || 4000))
  .catch((err) => console.log(err));


//setting up middlewares
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use("/peerjs", peerServer);
app.use(cookieParser());
app.use(express.urlencoded({
  extended: true
}))

const userConnected = [];
//making connections
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    userConnected.push(userId);
    socket.on('disconnect', ()=>{
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
      const index = userConnected.indexOf(userId);
      if(index > -1){
        userConnected.splice(index, 1);
      }
    })
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });
  });
});


app.get('*', checkUser);
app.get('/', (req,res) => res.render('home'));
app.get('/call', requireAuth, (req,res)=> res.render('call'));
app.use(authRoutes);

let roomName;
app.post("/create_room", requireAuth, (req, rsp) => {
  roomName = req.body.room
  rsp.redirect(`/room?${roomName}${uuidv4()}`);
});

app.get("/:room",  (req, res) => {
   res.render("room", { roomId: req.params.room, room_name: roomName});
});

