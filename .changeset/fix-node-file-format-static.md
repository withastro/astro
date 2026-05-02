---
"@astrojs/node": patch
---

Fixes prerendered pages returning 404 when `build.format` is set to `'file'` in standalone mode. Pages are emitted as `page.html` with this format, and the static file handler now correctly resolves clean URL requests (e.g. `/about`) to the matching `.html` file on disk.
