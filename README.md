CAPTIVE PORTAL EXAMPLE USING RADIUS COA
=======================================

This is an example implementation of a simple RADIUS-based captive portal
using node.js. It is intended as tutorial for the RADIUS authorization and
accounting interfaces of the Anyfi.net software. This example implementation
is not intended for production use.

Configurable settings in config/config.json:

RADIUS_SHARED_SECRET <string>
  The secret string shared between the RADIUS server and the RADIUS NAS.
  The value must match the entries "radius_autz_secret" and
  "radius_acct_secret" in myfid.conf.

RADIUS_AUTZ_PORT <integer>
  The UDP port used RADIUS authorization server. The value must match
  "radius_autz_port" in myfid.conf.

RADIUS_ACCT_PORT <integer>
  The UDP port used RADIUS accounting server. If the port is the same as
  RADIUS_AUTZ_PORT then RADIUS Interim-Update messages may be used to  refresh
  the NAT state if the CPE is behind NAT, allowing RADIUS CoA-Requests to
  reach the CPE. The value must match "radius_acct_port" in myfid.conf.

RADIUS_ACCT_INTERVAL <integer>
  RADIUS accounting update interval. Use a lower value for a higher resolution
  of the bandwidth quota enforcement. See also RADIUS_ACCT_PORT above for NAT
  traversal issues.

PORTAL_HTTP_PORT <integer>
  The HTTP port used by the captive portal.

PORTAL_HTTP_INTERFACE <string>
  The IP address of the interface that HTTP server will use. This IP address
  must be reachable from the CPEs. The captive portal URL is generated as
  "http://PORTAL_HTTP_INTERFACE:PORTAL_HTTP_PORT.

BLOCK_UNAUTHENTICATED <boolean>
  Drop all non-HTTP traffic for unauthorized stations. Disable this option
  to display a splash page without disrupting other services.

LOG_VERBOSE <boolean>
  Enable per-message RADIUS logging.
