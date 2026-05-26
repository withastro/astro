---
'@astrojs/sitemap': patch
---

Improves `<lastmod>` accuracy in the sitemap index. Each `<sitemap>` entry in `sitemap-index.xml` is now stamped with the most recent `lastmod` of the URLs in the child sitemap it points to, instead of repeating a single global date on every entry. When a child sitemap has no per-URL `lastmod`, the entry falls back to the `lastmod` option as before. This gives search engines a per-file freshness signal, so they can tell which child sitemaps actually changed without refetching all of them.
