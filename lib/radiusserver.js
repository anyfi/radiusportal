var radius = require('radius');
var dgram = require('dgram');
var util = require('util');

var path = require('path');
var fs = require('fs');

var config = require('../config/config')
var radiusclient = require('./radiusclient')

var verbose = config["LOG_VERBOSE"];
var secret = config["RADIUS_SHARED_SECRET"];

var dir = path.dirname(fs.realpathSync(__filename));
radius.add_dictionary(dir + '/../radius/');

function RadiusServer(authorizer, port) {
    var clients = {}

    var getClient = function(rinfo) {
	var key = rinfo.address + ":" + rinfo.port;
	if (!(key in clients)) {
	    console.log("New RADIUS NAS " + key);
	    clients[key] = radiusclient.createClient(authorizer, function(resp) {
		var msg;
		
		if (verbose) {
		    console.log(resp);
		}
		resp.secret = secret;
		msg = radius.encode(resp);
		server.send(msg, 0, msg.length, rinfo.port, rinfo.address);
	    });
	}

	return clients[key];
    }

    var server = dgram.createSocket('udp4');
    server.on('message', function (msg, rinfo) {
	var req = radius.decode({packet: msg, secret: secret});

	if (verbose) {
	    console.log(req);
	}
	getClient(rinfo).onMessage(req);
    });

    server.bind(port)
}

module.exports = {
    createServer: function(authorizer, port) {
	return new RadiusServer(authorizer, port);
    }
}
