---
'astro': patch
---

Fixes request body handling in the Node adapter when `req.body` is a `Buffer`, `Uint8Array`, or `ArrayBuffer`. Previously, binary body data was incorrectly JSON-stringified (producing `{"type":"Buffer","data":[...]}`) instead of being passed through directly. This affected libraries like `serverless-http` that set `req.body` to a `Buffer`.
