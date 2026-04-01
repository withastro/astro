---
'astro': patch
---

Fixes pages with dots in their filenames (e.g. `hello.world.astro`) returning 404 when accessed with a trailing slash in the dev server. The `trailingSlashForPath` function now only forces `trailingSlash: 'never'` for endpoints with file extensions, allowing pages to correctly respect the user's `trailingSlash` config.
