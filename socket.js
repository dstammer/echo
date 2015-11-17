module.exports.startSocket = function(opts){
	// Socket Part
	var http = require("http"),
		port = process.env.PORT || 5000,
		server = http.createServer(opts.app);
	
	server.listen(port);
	var WebSocketServer = require("ws").Server
	var wss = new WebSocketServer({server: server});
	var sockets = {};

	console.log("Web socket server started on port: " + port);

	wss.on("connection", function(ws){
		console.log("Socket connected");
		var user_id = "";
		ws.on("message", function(msg){
			var req = JSON.parse(msg),
				provider = req["provider"],
				identifier = req["identifier"],
				request = req["request"];

			if(!request || !provider || !identifier){
				return;
			}
			
			user_id = provider + "_" + identifier;
			sockets[user_id] = ws;

			switch(request){
				case "get_status":
					require("./handlers/socket.js")({models: opts.models, sockets: opts.sockets}).getStatus(req);
					break;
				case "get_previous_messages":
					require("./handlers/socket.js")({models: opts.models, sockets: opts.sockets}).getPreviousMessages(req);
					break;
				case "send_message":
					require("./handlers/socket.js")({models: opts.models, sockets: opts.sockets}).sendMessage(req);
					break;
				case "send_picture":
					require("./handlers/socket.js")({models: opts.models, sockets: opts.sockets}).sendPicture(req);
					break;
				case "send_request":
					require("./handlers/socket.js")({models: opts.models, sockets: opts.sockets}).sendRequest(req);
					break;
				case "message_viewed":
					require("./handlers/socket.js")({models: opts.models, sockets: opts.sockets}).messageViewed(req);
					break;
				case "change_message_color":
					require("./handlers/socket.js")({models: opts.models, sockets: opts.sockets}).changeMessageColor(req);
					break;
			}
		});

		ws.on("close", function(){
			console.log("Socket disconnected:" + user_id);
			if(user_id != ""){
				sockets["user_id"] = null;
			}
		});
	});
}