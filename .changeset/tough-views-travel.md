---
'@astrojs/node': patch
---

Fixes the standalone server exiting silently with code 0 when it fails to start listening (for example, when the port is already in use). The error is now logged and the process exits with code 1.
