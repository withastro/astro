---
'astro': minor
---

Adds `experimental.parallelPrerender` to render static pages in Node.js worker threads. Pass `true` to start one worker per available CPU core (minus one for the main thread), or `{ workers: number }` to set the pool size. `build.concurrency` sets how many pages each worker renders at once.
