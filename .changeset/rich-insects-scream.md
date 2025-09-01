---
'@astrojs/sitemap': minor
---

Add configurable XML namespaces support to sitemap generation

- Add `namespaces` option to control which XML namespaces are included
- Support for news, xhtml, image, and video namespaces
- All namespaces enabled by default for backward compatibility

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

Note: The xmlns:video="..." line is missing from the XML.