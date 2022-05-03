---
'astro': patch
'@astrojs/rss': patch
---

Introduce new @astrojs/rss package for RSS feed generation! This also adds a new global env variable for your project's configured "site": import.meta.env.SITE. This is consumed by the RSS feed helper to generate the correct canonical URL.
