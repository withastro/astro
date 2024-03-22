---
"astro": patch
---

This patch allows astro to run in node-compat mode in Deno. Deno doesn't support
construction of response from async iterables in node-compat mode so we need to
use ReadableStream.
