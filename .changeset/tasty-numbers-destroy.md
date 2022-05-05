---
'@astrojs/rss': minor
---

Change the optional "canonicalUrl" argument to a required "site" argument. This fixes problems with import.meta.env.SITE. If you want to use your project's "site" field for your RSS feeds, set site: import.meta.env.SITE in the rss function options
