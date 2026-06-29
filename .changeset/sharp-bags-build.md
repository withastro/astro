---
'@astrojs/cloudflare': patch
---

Fixes prerender errors being silently swallowed when pages throw during rendering in workerd, causing `astro build` to exit 0 and emit truncated HTML. The response body is now fully buffered inside workerd before being sent back to the build process, so streaming errors are caught and surfaced as build failures with clear error messages.
