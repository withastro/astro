---
'astro': patch
---

Fixes a bug where projects whose path contains an apostrophe (`'`) failed to load sessions, middleware, a cache provider, or a `src/fetch.ts` handler
