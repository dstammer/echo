var mongoose = require("mongoose");

module.exports.devPort = process.env.PORT || 9010;
module.exports.prodPort = process.env.PORT || 80;

module.exports.dbConnection = mongoose.createConnection("mongodb://heroku_f7g9b6v4:2d3cu38t03h1udt5p5r1khv7at@ds029814.mongolab.com:29814/heroku_f7g9b6v4");