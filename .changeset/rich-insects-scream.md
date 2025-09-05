---
'@astrojs/sitemap': minor
---

Adds a new configuration option `namespaces` for more control over XML namespaces used in sitemap generation

Excluding unused namespaces can help create cleaner, more focused sitemaps that are faster for search engines to parse and use less bandwidth. If your site doesn't have news content, videos, or multiple languages, you can exclude those namespaces to reduce XML bloat.

The `namespaces` option allows you to configure `news`, `xhtml`, `image`, and `video` namespaces independently. All namespaces enabled by default for backward compatibility and no changes to existing projects is necessary. But now you can choose to streamline your XML and avoid unnecessary code.

Example: Removing the video namespace
If you want to exclude the video namespace from your sitemap, set video: false in your configuration:

```
// astro.config.mjs
import { sitemap } from '@astrojs/sitemap';

export default {
  integrations: [
    sitemap({
      namespaces: {
        video: false,
        // other namespaces remain enabled by default
      }
    })
  ]
};
```

The generated XML will not include the xmlns:video namespace:

```
<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
  <!-- ... -->
</urlset>
```
