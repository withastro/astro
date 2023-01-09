---
'@astrojs/webapi': major
---

Replace node-fetch's polyfill with undici.

Since `undici` does not support it, this changes remove support for the `file:` protocol
