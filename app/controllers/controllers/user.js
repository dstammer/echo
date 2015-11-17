var validator = require('validator'),
	passport = require("passport"),
	mailer = require("../../../utils.js").email,
	encryption = require("../../../utils.js").encryption;

function random(){
	var text = "";
	var possible = "ABCDEFGHIJKLNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()_+-=\|{}[]`:;<>?,./";

	for(var i = 0; i < 8; i++){
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return text;
}

module.exports = function (opts) {
    var userModel = opts.models.User;//,
//        emailModel = opts.models.Email,
//		topicModel = opts.models.Topic;
        
    return {
		"post#sendEmailVerificationLink" : function (req, res) {
			var email = req.body.email;
			if(!email){
				req.flash('loginMessage', 'Email should not be empty.');
				return res.redirect('/login');
			}
			req.flash('email', email);

			userModel.findOne({'email': email}, function(err, user){
				if(err){
					console.log(' ---- err ---- ');
					req.flash('loginMessage', 'Service temporarily unavailable.');
					return res.redirect('/login');
				}
				if(!user){
					console.log(' ---- user not found ---- ');
					req.flash('loginMessage', 'No user found with given credentials.');
					return res.redirect('/login');
				}

				if(process.env.HEROKU){
					var url = 'https://www.taskflight.com/';
				} else{
					var url = 'http://localhost:9010/';
				}
				var timestamp = new Date().getTime();
				url = url + 'emailVerification/' + encryption.encrypt(timestamp + '____' + user._id.toString() + '____' + timestamp);
				mailer.sendMail({
					from: "noreply@vantagon.com", // sender address
					to: req.body.email, // list of receivers
					subject: "Welcome to Taskflight", // Subject line
					text: "Dear " + user.firstname + " " + user.lastname + ", \n\n" + 
						  "Please verify your email address with the following link.\n\n" +
						  url + '\n\n' +
						  "Thank you\nTaskflight Team",
					html: "Welcome " + user.firstname + " " + user.lastname + ", <br><br>" + 
						  "Please verify your email address with the following link.<br><br>" +
						  '<a href="' + url + '">' + url + '</a><br><br>' +
						  "Thank you<br>Taskflight Team"
				}, function (err) {
					if(err){
						req.flash('loginMessage', "Service Temporarily Unavailable")
						return res.redirect('/login');
					} else {
						req.flash('verifyNeeded', '1');
						return res.redirect('/notification');
					}
				});
			});
		},
		"post#requestEmailVerificationLink" : function (req, res) {
			var email = req.body.email;
			if(!email){
				return res.json({success: false, message: "Email should not be empty."});
			}

			userModel.findOne({'email': email}, function(err, user){
				if(err){
					return res.json({success: false, message: "Service temporarily unavailable."});
				}
				if(!user){
					return res.json({success: false, message: "No user found with given credentials."});
				}

				if(process.env.HEROKU){
					var url = 'https://www.taskflight.com/';
				} else{
					var url = 'http://localhost:9010/';
				}
				var timestamp = new Date().getTime();
				url = url + 'emailVerification/' + encryption.encrypt(timestamp + '____' + user._id.toString() + '____' + timestamp);
				mailer.sendMail({
					from: "noreply@vantagon.com", // sender address
					to: req.body.email, // list of receivers
					subject: "Welcome to Taskflight", // Subject line
					text: "Dear " + user.firstname + " " + user.lastname + ", \n\n" + 
						  "Please verify your email address with the following link.\n\n" +
						  url + '\n\n' +
						  "Thank you\nTaskflight Team",
					html: "Welcome " + user.firstname + " " + user.lastname + ", <br><br>" + 
						  "Please verify your email address with the following link.<br><br>" +
						  '<a href="' + url + '">' + url + '</a><br><br>' +
						  "Thank you<br>Taskflight Team"
				}, function (err) {
					if(err){
						return res.json({success: false, message: "Service temporarily unavailable."});
					} else {
						return res.json({success: true});
					}
				});
			});
		},
		"post#forgotPassword" : function (req, res) {
			var email = req.body.email;
			if(!email){
				req.flash('forgotMessage', 'Email should not be empty.');
				return res.redirect('/login#forgot-password');
			}
			req.flash('email', email);
			userModel.findOne({'email': email}, function(err, user){
				if(err){
					req.flash('forgotMessage', 'Service temporarily unavailable.');
					return res.redirect('/login#forgot-password');
				}
				if(!user){
					req.flash('forgotMessage', 'No user found with given credentials.');
					return res.redirect('/login#forgot-password');
				}

				var password = random();
				user.password = encryption.encrypt(password);
				user.save(function(err, nUser){
					if(nUser){
						if(process.env.HEROKU){
							var url = 'https://www.taskflight.com/';
						} else{
							var url = 'http://localhost:9010/';
						}
						var timestamp = new Date().getTime();
						url = url + 'forgotPassword/' + encryption.encrypt(timestamp + '____' + user._id.toString() + '____' + timestamp);
						mailer.sendMail({
							from: "noreply@vantagon.com", // sender address
							to: req.body.email, // list of receivers
							subject: "Password Recovery", // Subject line
							text: "Dear " + user.firstname + " " + user.lastname + ", \n\n" + 
								  "We have set an random password. Please login and change your password.\n\n" +
								  'New Password: ' + password + '\n\n' +
								  "Thank you\nTaskflight Team",
							html: "Dear " + user.firstname + " " + user.lastname + ", <br><br>" + 
								  "We have set an random password. Please login and change your password.<br><br>" +
								  'New Password: ' + password + '<br><br>' +
								  "Thank you<br>Taskflight Team"
						}, function (err) {
							if(err){
								req.flash('forgotMessage', "Service Temporarily Unavailable");
								return res.redirect('/login#forgot-password');
							} else {
								req.flash('verifyNeeded', '2');
								return res.redirect('/notification');
							}
						});
					} else {
						req.flash('forgotMessage', "Service Temporarily Unavailable");
						return res.redirect('/login#forgot-password');
					}
				});
			});
		},
		"post#requestPasswordChangeLink" : function (req, res) {
			var email = req.body.email;
			if(!email){
				return res.json({success: false, message: "Email should not be empty."});
			}
			userModel.findOne({'email': email}, function(err, user){
				if(err){
					return res.json({success: false, message: "Service temporarily unavailable."});
				}
				if(!user){
					return res.json({success: false, message: "No user found with given credentials."});
				}

				var password = random();
				user.password = encryption.encrypt(password);
				user.save(function(err, nUser){
					if(nUser){
						if(process.env.HEROKU){
							var url = 'https://www.taskflight.com/';
						} else{
							var url = 'http://localhost:9010/';
						}
						var timestamp = new Date().getTime();
						url = url + 'forgotPassword/' + encryption.encrypt(timestamp + '____' + user._id.toString() + '____' + timestamp);
						mailer.sendMail({
							from: "noreply@vantagon.com", // sender address
							to: req.body.email, // list of receivers
							subject: "Password Recovery", // Subject line
							text: "Dear " + user.firstname + " " + user.lastname + ", \n\n" + 
								  "We have set an random password. Please login and change your password.\n\n" +
								  'New Password: ' + password + '\n\n' +
								  "Thank you\nTaskflight Team",
							html: "Dear " + user.firstname + " " + user.lastname + ", <br><br>" + 
								  "We have set an random password. Please login and change your password.<br><br>" +
								  'New Password: ' + password + '<br><br>' +
								  "Thank you<br>Taskflight Team"
						}, function (err) {
							if(err){
								return res.json({success: false, message: "Service temporarily unavailable."});
							} else {
								return res.json({success: true});
							}
						});
					} else {
						return res.json({success: false, message: "Service temporarily unavailable."});
					}
				});
			});
		}
 /*       
        "get#logout" : function (req, res) {
            req.logout();
			req.user = null;
            return res.json({ success : true });
        },

            
        }*/
    }
}
