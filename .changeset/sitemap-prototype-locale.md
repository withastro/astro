---
'@astrojs/sitemap': patch
---

Fixes i18n locale matching for pages whose first path segment is named like an `Object.prototype` property, such as `/constructor/` or `/toString/`. These were treated as locales, producing invalid alternate links. Also rejects an i18n `defaultLocale` that is only an inherited object property rather than a configured locale.
