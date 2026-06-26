---
'@astrojs/cloudflare': patch
---

Fixes a bug where the Cloudflare adapter's workerd prerenderer would silently produce empty HTML files when a page throws during rendering. The build now fails with a descriptive error message instead of completing with exit code 0 and 0-byte output files.
