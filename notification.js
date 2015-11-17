var apn = require('apn');

module.exports = {
	send : function(token, message, badge, payload, callback){
		var options = {
			cert : "./push/devcert.pem",
			key : "./push/dev.pem",
			passphrase : "password",
			production : false,
			"batchFeedback": true,
			"interval": 300
		};

		//var feedback = new apn.Feedback(options);
		//feedback.on("feedback", function(devices) {
			//devices.forEach(function(item) {
				//callback();
			//});
		//});

		var apnConnection = new apn.Connection(options);

		var myDevice = new apn.Device(token);

		var note = new apn.Notification();

		note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
		note.badge = 1;
		note.sound = "default";
		note.alert = message;//"\uD83D\uDCE7 \u2709 You have a new message";
		note.payload = payload;

		console.log('push message - ' + message);

		apnConnection.pushNotification(note, myDevice);
		console.log('apns token - ' + token);
	}
};