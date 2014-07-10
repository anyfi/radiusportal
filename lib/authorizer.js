function Authorizer() {
    var sessions = {}
    var clients = {}

    function getSeconds() {
	return Math.round((new Date()).getTime() / 1000);
    }

    function toMB(bytes) {
	return (bytes / (1024.0 * 1024.0)).toFixed(2) + " MB";
    }

    function logAuth(mac, authorized, time, quota) {
	if (!authorized) {
	    console.log("Authorization DENIED for " + mac);
	}
	else if (time && quota) {
	    console.log("Authorizing " + mac + " for " + time + " seconds and " + toMB(quota));
	}
	else if (time) {
	    console.log("Authorizing " + mac + " for " + time + " seconds");
	}
	else if (quota) {
	    console.log("Authorizing " + mac + " for " + toMB(quota));
	}
	else {
	    console.log("Authorizing " + mac);
	}
    }

    function getTimeout(mac) {
	if (sessions[mac] && sessions[mac].timeout) {
	    return sessions[mac].timeout - (getSeconds() - sessions[mac].started_at);
	}
	return null;
    }

    function getQuota(mac) {
	if (sessions[mac] && sessions[mac].quota) {
	    return sessions[mac].quota - sessions[mac].upload - sessions[mac].download;
	}
	return null;
    }

    // Handle an authorization request
    this.onRequest = function(mac, callback) {
	var timeout = getTimeout(mac);
	var quota = getQuota(mac);
	var authorized = sessions[mac] != null;

	console.log("Authorization request for " + mac);

	if (timeout <= 0 || quota <= 0) {
	    delete sessions[mac];
	    authorized = false;
	}
	logAuth(mac, authorized, timeout, quota);
	callback(authorized, timeout);
    }

    // Handle an authorization accepted event
    this.onAccept = function(mac, time, quota, callback) {
	if (clients[mac]) {
	    clients[mac].onAuthorize(mac, time, function() {
		logAuth(mac, true, time, quota);
		sessions[mac] = {started_at: getSeconds(), timeout: time,
				 upload: 0, download: 0, quota: quota};
		callback();
	    });
	}
    }

    // Handle an accounting event
    this.onAccount = function(mac, upload, download, start) {
	if (clients[mac] && sessions[mac] && sessions[mac].quota) {   
	    if (start) {
		sessions[mac].quota -= sessions[mac].upload + sessions[mac].download;
	    }

	    console.log("Accounting " + toMB(download) + " downloaded and " + toMB(upload) + " uploaded for " + mac);
	    sessions[mac].upload = upload;
	    sessions[mac].download = download;

	    if (upload + download > sessions[mac].quota) {
		console.log("Deauthorizing " + mac + " due to exceeded quota"); 
		delete sessions[mac];
		clients[mac].onDeauthorize(mac);
	    }
	}
    }

    this.setClient = function(mac, client) {
	clients[mac] = client;
    }
}

module.exports = {
    createAuthorizer: function() {
	return new Authorizer();
    }
};
