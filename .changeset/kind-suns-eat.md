---
'astro': patch
---

Fixes the dev toolbar breaking when importing client dependencies in `.astro` `<script>` tags

The client environment's `optimizeDeps.entries` glob was missing `.astro`, preventing Vite's dep scanner from discovering `<script>` tag imports during the initial optimization pass. Undiscovered deps triggered runtime re-optimization, invalidating all previously optimized modules (including the dev toolbar entrypoint) with 504 "Outdated Optimize Dep" errors.
