module.exports = function (opts) {
    var socialModel = opts.models.Social,
		requestModel = opts.models.Request,
		echoModel = opts.models.echo,
		sockets = opts.sockets,
		async = require('async'),
		notification = require("../notification.js");
        
    return {
        "getStatus" : function (req) {
            var provider = req.provider,
				identifier = req.identifier,
				to_provider = req.to_provider,
				to_identifier = req.to_identifier;
                            
			var query = socialModel.findOne({$and : [{social_id: to_identifier}, {provider: to_provider}]}),
				to_socket = sockets[to_provider + "_" + to_identifier],
				my_socket = sockets[provider + "_" + identifier];
            query.exec(function (err, social) {
                if (err) {
                    console.log(err);

                    if(my_socket){
						my_socket.send(JSON.stringify({"response" : "return_status", "success" : false, "error": "Internal Server Error!"}));
					}
                } else if (social) {
					var ret = {};

					ret.echo_status = social.echo_text != "";
					ret.response = "return_status";
					ret.success = true;

					requestModel.findOne({$and : [{from_id: from_identifer}, {to_id: to_identifier}, {provider: to_provider}]}).sort({ field: -timestamp }).limit(1).exec(function(err, echo_request){
						if(err){
							console.log(err);

							if(my_socket){
								my_socket.send(JSON.stringify({"response" : "return_status", "success" : false, "error": "Internal Server Error!"}));
							}
						} else if(echo_request){
							if(my_socket){
								ret.connection_status = echo_request.type;
								my_socket.send(JSON.stringify(ret));
							}
						} else {
							if(my_socket){
								ret.connection_status = "0";
								my_socket.send(JSON.stringify(ret));
							}
						}
					});

                } else {
					if(my_socket){
						my_socket.send(JSON.stringify({"response" : "return_status", "success" : false, "error": "User Not Found!"}));
					}
                }
            });
        },
		"getPreviousMessages" : function (req) {
            var provider = req.provider,
				identifier = req.identifier,
				to_provider = req.to_provider,
				to_identifier = req.to_identifier,
				time = req.timestamp;

			if(time){
				time = time * 1000;
			} else {
				time = new Date().getTime();
			}
                            
			var query = echoModel.find({$and : [{$or : [{$and : [{to_id: to_identifier}, 
														  {from_id: from_identifier}, 
														  {provider: to_provider}]},
														{$and : [{from_id: to_identifier}, 
														  {to_id: from_identifier}, 
														  {provider: to_provider}]}
														]
												}, 
												timestamp: {$lt: time}]}).sort({ field: -timestamp }).limit(10),
				to_socket = sockets[to_provider + "_" + to_identifier],
				my_socket = sockets[provider + "_" + identifier];

            query.exec(function (err, echos) {
                if (err) {
                    if(my_socket){
						my_socket.send(JSON.stringify({"response" : "return_previous_messages", "success" : false, "error": "Internal Server Error!"}));
					}
                } else if (echos) {
					var ret = {};

					ret.response = "return_previous_messages";
					ret.success = true;
					ret.messages = echos;

					if(my_socket){
						my_socket.send(JSON.stringify(ret));
					}
					

					//Function To Save Viewed Status
					async.each(echos, function (item, callback) {
						item.is_received = "YES";
						item.save();
					}, function(){});
                } else {
					if(my_socket){
						my_socket.send(JSON.stringify({"response" : "return_previous_messages", "success" : false, "messages": []}));
					}
                }
            });
        },
		"sendRequest" : function (req) {
            var provider = req.provider,
				identifier = req.identifier,
				to_provider = req.to_provider,
				to_identifier = req.to_identifier,
				lat = req.lat,
				lng = req.lng,
				type = req.type;
                            
			var to_socket = sockets[to_provider + "_" + to_identifier],
				my_socket = sockets[provider + "_" + identifier];

            var request = new requestModel();

			request.provider = provider;
			request.from_id = identifier;
			request.to_id = to_identifier;
			request.location = JSON.parse({"lat":lat, "lng": lng});
			request.type = type;
			request.timestamp = new Date().getTime();

			request.save(function(err, nRequest){
				if(!nRequest){
					return;
				}

				if(to_socket){
					to_socket.send(JSON.stringify({"response":"echo_request_received", "provider": provider, "from_id": identifier}));
				}

				if(nRequest.type == "1"){
					var push = require('./notification.js');
					socialModel.findOne({$and : [{social_id: to_identifier}, {provider: to_provider}]}).exec(function(err, social){
						if(social){
							push.send(social.device_token, "You have received a new echo request from " + social.name, 1, {}, null);
						}
					});
				}
			});
        },
		"sendMessage" : function (req) {
            var provider = req.provider,
				identifier = req.identifier,
				to_provider = req.to_provider,
				to_identifier = req.to_identifier,
				text = req.text;
                            
			var to_socket = sockets[to_provider + "_" + to_identifier],
				my_socket = sockets[provider + "_" + identifier];

            var message = new echoModel();

			message.provider = provider;
			message.from_id = identifier;
			message.to_id = to_identifier;
			message.text = text;
			message.timestamp = new Date().getTime();
			message.is_received = "NO";
			message.is_picture = "NO";
			message.from_color = "";
			message.to_color = "";

			message.save(function(err, nMessage){
				if(!nMessage){
					return;
				}

				if(to_socket){
					to_socket.send(JSON.stringify({"response":"echo_received", "message": nMessage}));
				}

				var push = require('./notification.js');
				socialModel.findOne({$and : [{social_id: to_identifier}, {provider: to_provider}]}).exec(function(err, social){
					if(social){
						push.send(social.device_token, "You have received a new echo from " + social.name + ' "' + message.text + '"', 1, {}, null);
					}
				});
			});
        },
		"sendPicture" : function (req) {
            var provider = req.provider,
				identifier = req.identifier,
				to_provider = req.to_provider,
				to_identifier = req.to_identifier,
				text = req.text;
                            
			var to_socket = sockets[to_provider + "_" + to_identifier],
				my_socket = sockets[provider + "_" + identifier];

            var message = new echoModel();

			message.provider = provider;
			message.from_id = identifier;
			message.to_id = to_identifier;
			message.text = text;
			message.timestamp = new Date().getTime();
			message.is_received = "NO";
			message.is_picture = "YES";
			message.from_color = "";
			message.to_color = "";

			message.save(function(err, nMessage){
				if(!nMessage){
					return;
				}

				if(to_socket){
					to_socket.send(JSON.stringify({"response":"echo_received", "message": nMessage}));
				}

				var push = require('./notification.js');
				socialModel.findOne({$and : [{social_id: to_identifier}, {provider: to_provider}]}).exec(function(err, social){
					if(social){
						push.send(social.device_token, "You have received a new image from " + social.name, 1, {}, null);
					}
				});
			});
        },
		"messageViewed" : function (req) {
            var provider = req.provider,
				identifier = req.identifier,
				to_provider = req.to_provider,
				to_identifier = req.to_identifier,
				id = req.id;
                            
			var to_socket = sockets[to_provider + "_" + to_identifier],
				my_socket = sockets[provider + "_" + identifier];

            echoModel.findOne({_id: id}).exec(function(err, message){
				if(message){
					message.is_received = "YES";

					message.save(function(err, nMessage){
						if(nMessage){
							if(to_socket){
								to_socket.send(JSON.stringify({"response":"echo_viewed", "id": id}));
							}
						}
					});
				}
			});
        },
		"changeMessageColor" : function (req) {
            var provider = req.provider,
				identifier = req.identifier,
				id = req.id,
				color = req.color;

            echoModel.findOne({_id: id}).exec(function(err, message){
				if(message){
					if(message.to_id == identifier){
						message.to_color = JSON.stringify(color);
					} else {
						message.from_color = JSON.stringify(color);
					}

					message.save();
				}
			});
        },
    }
}