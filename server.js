
var app = require("express")();
var http = require("http");
var https = require("https");
//var io = require("socket.io")(http);
var fs = require("fs");

var options = {
	key: fs.readFileSync('/etc/letsencrypt/live/sunew.xyz/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/sunew.xyz/cert.pem')
};
var serverPort = 443;
var server = https.createServer(options, app);

var io = require("socket.io")(server, {wsEngine: 'ws'});

server.listen(2019, function() {
	console.log("Listening on *:2019");
});

var roomlist = {};
var user2room = {};


io.on("connection", function(socket) {
        console.log("connect");
	socket.emit("roomlist", roomlist);

        socket.on("disconnect", function() {
                socket.leave();
                console.log("disconnect");
		var id = socket.id;
		var room = user2room[socket.id];
		delete user2room[socket.id];
		roomlist[room]--;
		if (!roomlist[room]) {
			delete roomlist[room];
		
		}
		console.log(user2room);
		console.log(roomlist);
		socket.broadcast.emit("roomlist", roomlist);
		socket.broadcast.to(room).emit("remove", id);
        });
        socket.on("create or join", function(room) {
                //var num = io.sockets.sockets.length;
		if (user2room[socket.id]) {
			console.log("Already added room");
			socket.emit("already added room");
			return false;
		}
		user2room[socket.id] = room;
		
                if (!roomlist[room]) {
                        console.log("create");
			roomlist[room] = 1;
                        socket.join(room);
			
                } else {
                        console.log("join");
			roomlist[room]++;
                        socket.join(room);	
                }
		console.log(user2room);
		io.emit('roomlist', roomlist);
        });
        socket.on("message", function(msg) {
                console.log("message:" + user2room[socket.id]);

                //socket.broadcast.emit("message", msg);
                socket.broadcast.to(user2room[socket.id]).emit("message", msg);
        });
	socket.on("chat", function(msg) {
		console.log("chat:"+msg);
		socket.broadcast.to(user2room[socket.id]).emit("message", msg);
	});
});
