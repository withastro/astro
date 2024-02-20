---
"@astrojs/sitemap": minor
---

Adds a new configuration option `prefix` that allows you to change the default `sitemap-*.xml` file name.

By default, running `astro build` creates both `sitemap-index.xml` and `sitemap-0.xml` in your output directory. 

To change the names of these files (e.g. to `astrosite-index.xml` and `astrosite-0.xml`), set the `prefix` option in your `sitemap` integration configuration:

```
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://example.com',
  integrations: [
    sitemap({
      prefix: 'astrosite-',
    }),
  ],
});
```

This option is useful when Google Search Console is unable to fetch your default sitemap files, but can read renamed files.
