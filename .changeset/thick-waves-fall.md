---
'astro': patch
---

Fixes image optimization during `astro build` using too many parallel processes in CPU-limited containers. Builds now respect the container's CPU limit, reducing peak memory usage and avoiding out-of-memory crashes.
</content>
</invoke>
