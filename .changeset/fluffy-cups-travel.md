---
'@astrojs/rss': major
---

Update RSS configuration with content collections in mind.

1. Expose an `rssSchema` for use with content collections. This ensures all RSS feed properties are present in your frontmatter:

```ts
import { defineCollection } from 'astro:content';
import { rssSchema } from '@astrojs/rss';

const blog = defineCollection({
  schema: rssSchema,
});

export const collections = { blog };
```

2. Move implicit `import.meta.glob` handling to a separate `pagesGlobToRssItems()` helper. This simplifies our `items` configuration option to accept a single type, without losing existing functionality:

```ts
// src/pages/rss.xml.js
import rss, { pagesGlobToRssItems } from '@astrojs/rss';

export function get(context) {
  return rss({
    items: pagesGlobToRssItems(
      import.meta.glob('./blog/*.{md,mdx}'),
    ),
  });
}
```

#### Migration

If you rely on our `import.meta.glob` handling, add the `pagesGlobToRssItems()` wrapper to your RSS config:

```diff
// src/pages/rss.xml.js
import rss, {
+  pagesGlobToRssItems
} from '@astrojs/rss';

export function get(context) {
  return rss({
+    items: pagesGlobToRssItems(
      import.meta.glob('./blog/*.{md,mdx}'),
+    ),
  });
}
```
