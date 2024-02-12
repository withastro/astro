---
"astro": patch
---

Improves Node.js streaming performance

This uses an AsyncIterable instead of a ReadableStream to do streaming in Node.js. This is a non-standard enhancement by Node, so this is done only in that environment.
