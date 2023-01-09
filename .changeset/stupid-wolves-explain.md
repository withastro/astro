---
'@astrojs/webapi': major
---

Replace node-fetch's polyfill with undici.

Since `undici` does not support it, this change also removes custom support for the `file:` protocol
