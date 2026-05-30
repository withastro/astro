---
'@astrojs/node': patch
---

Fixes prerendered pages returning 404 when using `build.format: 'file'` or `build.format: 'preserve'` with the Node adapter in standalone mode.

Previously, clean URLs like `/about` would fail to resolve to `about.html` on disk, because the static file handler only supported the default `directory` format (`about/index.html`). Now the handler correctly resolves clean URLs to `.html` files when the build format produces them.
