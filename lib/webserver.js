var http = require('http');
var util = require('util');
var url = require('url');

function macid(mac) {
    return mac.replace(/:/g,'-').toUpperCase();
}

function WebServer(authorizer, port) {
    var server = http.createServer(function (req, res) {
	var query = url.parse(req.url, true).query;

	if ("allow_mac" in query) {
	    authorizer.onAccept(macid(query["allow_mac"]), query["time"], query["bytes"], function() {
		if ("url" in query) {
		    res.writeHead(302, {'Location': query["url"]});
		}
		else {
		    res.writeHead(302, {'Location': 'http://google.com'});
		}
		res.end();
	    });
	}
	else if ("client" in query && "radio" in query && "service" in query) {
	    res.writeHead(200, {'Content-Type': 'text/html'});
	    res.write("<h2>Example captive portal</h2>");
	    if (query["username"]) {
		res.write("Username: " + query["username"] + "<br>");
	    }
	    res.write("Client: " + query["client"] + "<br>");
	    res.write("Radio: " + query["radio"] + "<br>");
	    res.write("Service: " + query["service"] + "<br><br>");
	    
	    res.write('<table><tr>');
	    res.write('<td><form method="get">');
	    res.write('<input type="submit" value="100 MB">');
	    res.write('<input type="hidden" name="allow_mac" value="' + query["client"] + '">');
	    res.write('<input type="hidden" name="url" value="' + query["url"] + '">');
	    res.write('<input type="hidden" name="bytes" value="' + (100 * 1024 * 1024).toString() + '">');
	    res.write('</form></td>');

	    res.write('<td><form method="get">');
	    res.write('<input type="submit" value="15 min">');
	    res.write('<input type="hidden" name="allow_mac" value="' + query["client"] + '">');
	    res.write('<input type="hidden" name="url" value="' + query["url"] + '">');
	    res.write('<input type="hidden" name="time" value="900">');
	    res.write('</form></td>');

	    res.write('<td><form method="get">');
	    res.write('<input type="submit" value="One hour">');
	    res.write('<input type="hidden" name="allow_mac" value="' + query["client"] + '">');
	    res.write('<input type="hidden" name="url" value="' + query["url"] + '">');
	    res.write('<input type="hidden" name="time" value="3600">');
	    res.write('</form></td>');

	    res.write('<td><form method="get">');
	    res.write('<input type="submit" value="One day">');
	    res.write('<input type="hidden" name="allow_mac" value="' + query["client"] + '">');
	    res.write('<input type="hidden" name="url" value="' + query["url"] + '">');
	    res.write('<input type="hidden" name="time" value="86400">');
	    res.write('</form></td>');
	    
	    res.write('<td><form method="get">');
	    res.write('<input type="submit" value="Forever">');
	    res.write('<input type="hidden" name="allow_mac" value="' + query["client"] + '">');
	    res.write('<input type="hidden" name="url" value="' + query["url"] + '">');
	    res.write('</form></td>');
	    res.write('</tr></table>');
	    res.end();
	}
	else {
	    res.writeHead(302, {'Location': 'http://google.com'});
	    res.end();
	}
    });

    server.listen(port);
}

module.exports = {
    createServer: function(authorizer, port) {
	return new WebServer(authorizer, port);
    }
};
