---
'@astrojs/sitemap': patch
---

Fixes a bug where the default sitemap included the original URL after a `chunks` callback returned a copy of the entry with a rewritten URL

Keeps explicitly matched URLs in a custom `pages` chunk alongside unmatched entries.
