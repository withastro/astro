---
'@astrojs/sitemap': patch
---

Fixes a bug where pages whose first path segment matches a built-in object property name, such as `/constructor/` or `/toString/`, were treated as locales when the `i18n` option was set, producing invalid `hreflang` alternates or failing the build
