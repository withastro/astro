---
'@astrojs/sitemap': patch
---

Fixes i18n alternate links for pages whose first path segment is named like an `Object.prototype` property, such as `/constructor/` or `/toString/`. These were treated as locales, so they were listed as alternates of the home page with an invalid `hreflang`.
