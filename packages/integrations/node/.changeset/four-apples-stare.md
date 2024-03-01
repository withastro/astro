---
'@astrojs/node': patch
---

Modified node package to properly assign server.host option set to `true` to listen on all network interfaces. Added test to test this functionality.
