var config = require('../config/config');

var interval = config["RADIUS_ACCT_INTERVAL"];
var block_unauth = config["BLOCK_UNAUTHENTICATED"];
var portal_url = 'http://' + config["PORTAL_HTTP_INTERFACE"] + 
                 ':' + config["PORTAL_HTTP_PORT"];

function setAttributes(msg, authorized, timeout) {
    if (interval) {
	msg.attributes.push(['Acct-Interim-Interval', interval.toString()]);
    }
    if (timeout) {
	msg.attributes.push(['Termination-Action', 'RADIUS-Request']);
	msg.attributes.push(['Session-Timeout', timeout.toString()]);
    }
    if (!authorized) {
	if (block_unauth) {
	    // Allow DHCP and DNS
	    msg.attributes.push(['NAS-Filter-Rule', 'permit in 17 from any to any 53,67-68\0'])

	    // Drop everything else
	    msg.attributes.push(['NAS-Filter-Rule', 'deny in ip from any to any'])
	}

	// Redirect all HTTP traffic to the captive portal
	msg.attributes.push(['Vendor-Specific', 'WISPr', [['WISPr-Redirection-URL', portal_url]]]);
    }
}

function RadiusClient(authorizer, send_func) {
    var requests = {};
    var identifier = 0;

    // Handle an incoming RADIUS message
    this.onMessage = function(msg) {
	if (msg.code == 'Access-Request' &&
	    msg.attributes['Service-Type'] == 'Call-Check')
	{
	    var mac = msg.attributes['Calling-Station-Id'];

	    authorizer.setClient(mac, this);
	    authorizer.onRequest(mac, function(authorized, timeout) {
		var resp = {
		    identifier: msg.identifier,
                    authenticator: msg.authenticator,
		    code: 'Access-Accept',
		    attributes: [],
		};

		// Retry authorization in 30 seconds
		if (!authorized) {
		    timeout = 30;
		}

		setAttributes(resp, authorized, timeout);
		send_func(resp);
            });
	}
	else if (msg.code == 'Accounting-Request') {
	    var resp = {
		identifier: msg.identifier,
                authenticator: msg.authenticator,
		code: 'Accounting-Response',
		attributes: [],
	    };

	    send_func(resp);

	    // Notify the authorizer about the upload/download counts
	    var upload = parseInt(msg.attributes['Acct-Input-Octets'] || '0', 10) +
		         (parseInt(msg.attributes['Acct-Input-Gigawords'] || '0', 10) << 32);
	    var download = parseInt(msg.attributes['Acct-Output-Octets'] || '0', 10) +
		          (parseInt(msg.attributes['Acct-Output-Gigawords'] || '0', 10) << 32);
	    authorizer.onAccount(msg.attributes['Calling-Station-Id'], upload, download,
				 msg.attributes['Acct-Status-Type'] == 'Start');
	}
	else if (msg.code == 'CoA-ACK' || msg.code == 'Disconnect-ACK') {
	    var callback = requests[msg.identifier];
	    if (callback) {
		callback();
		delete requests[msg.identifer];
	    }
	}
	else if (msg.code == 'CoA-NAK' || msg.code == 'Disconnect-NAK') {
	    console.log('Received NAK');
	}
	else {
	    console.log('Received unexpected RADIUS message ' + msg.code);
	}
    }

    // Handle an authorization event
    this.onAuthorize = function(mac, timeout, callback) {
	var resp = {
	    code: 'CoA-Request',
	    identifier: identifier.toString(),
	    attributes: [],
	};

	requests[identifier] = callback;
	identifier = (identifier + 1) & 0xff;

	resp.attributes.push(['Calling-Station-Id', mac]);
	setAttributes(resp, true, timeout);
	send_func(resp);
    }

    // Handle a deauthorization event
    this.onDeauthorize = function(mac) {
	var resp = {
	    code: 'CoA-Request',
	    identifier: identifier.toString(),
	    attributes: [],
	};

	identifier = (identifier + 1) & 0xff;

	resp.attributes.push(['Calling-Station-Id', mac]);
	setAttributes(resp, false, 30);
	send_func(resp);
    }

    // Handle a disconnect event
    this.onDisconnect = function(mac) {
	var resp = {
	    code: 'Disconnect-Request',
	    identifier: identifier.toString(),
	    attributes: [],
	};

	identifier = (identifier + 1) & 0xff;

	resp.attributes.push(['Calling-Station-Id', mac]);
	send_func(resp);
    }
}

module.exports = {
    createClient: function(authorizer, send_func) {
	return new RadiusClient(authorizer, send_func);
    }
}
