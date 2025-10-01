---
'astro': major
---

Updates trailing slash behavior of endpoint URLs.

In Astro v5.0, custom endpoints whose URL ended in a file extension (e.g. `/src/pages/sitemap.xml.ts` ) could be accessed with a trailing slash (`/sitemap.xml/`) or without (`/sitemap.xml`), regardless of the value configured for `build.trailingSlash`.

In Astro v6.0, these endpoints can only be accessed without a trailing slash. This is true regardless of your `build.trailingSlash` configuration.

#### What should I do?

Review your links to your custom endpoints that include a file extension in the URL and remove any trailing slashes:

```diff
-<a href="/sitemap.xml/">Sitemap</a>
+<a href="/sitemap.xml">Sitemap</a>
```
