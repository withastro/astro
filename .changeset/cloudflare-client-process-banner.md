---
'@astrojs/cloudflare': patch
---

Fixes the `globalThis.process` shim being prepended to client-side scripts. The shim is now only added to the server output.
