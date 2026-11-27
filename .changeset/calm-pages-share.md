---
'@astrojs/node': patch
---

Fixes prerendered pages returning 404 with `build.format: 'file'` or `'preserve'` when a folder has the same name (`blog.html` next to `blog/one.html`), when the page name contains a dot (`/v1.2`), or when the URL has a trailing slash and `trailingSlash` is `'ignore'`
