---
'astro': patch
---

Prevents `App.match()` from throwing on request paths that contain an invalid percent-sequence.

Paths such as `/%C0%AF` (an overlong-UTF-8 encoding of `/`, commonly sent by automated path-traversal and `.env` scanners) made the internal `decodeURI()` call throw `URIError: URI malformed`. Because matching runs before `App.render()`, the error escaped the adapter's request handler as an uncaught exception (HTTP 500) that user middleware could not catch. These paths now fall back to the raw, undecoded pathname so the request is matched (and typically 404s) instead of crashing.
