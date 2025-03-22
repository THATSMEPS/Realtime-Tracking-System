const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const cors = require("cors");
app.use(cors()); 
const socketio = require("socket.io");
const server = http.createServer(app);

const io = socketio(server, {
    cors: {
        origin: "*", // Change "*" to your frontend URL in production
        methods: ["GET", "POST"]
    }
});


app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname,"public")));

io.on("connection", function (socket) {
    console.log(`User connected: ${socket.id}`);
    socket.on("send-location", function (data) {
        io.emit("receive-location", {id: socket.id, ...data});
    });

    socket.on("disconnect", function() {
        console.log(`User disconnected: ${socket.id}`);
        io.emit("user-disconnected", socket.id);
    });
    
    socket.on("error", function (err) {
        console.error(`Socket error: ${err}`);
    });
});

app.get ("/", function(req, res) {
    res.render("index");
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});