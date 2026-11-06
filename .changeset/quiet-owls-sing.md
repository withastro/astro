---
'@astrojs/sitemap': patch
---

Fixes a build error when the `i18n` option is set and a top-level page is named after a built-in object property, such as `/constructor/`
