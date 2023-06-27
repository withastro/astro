---
"astro": patch
---

Replaces the instance of `setTimeout()` in the runtime to use `queueMicrotask()`, to resolve limitations on Cloudflare Workers.
