---
'@astrojs/rss': minor
---

Update RSS config for readability and consistency with Astro 2.0.

#### Migration - `import.meta.glob()` handling

We have deprecated `items: import.meta.glob(...)` handling in favor of a separate `pagesGlobToRssItems()` helper. This simplifies our `items` configuration option to accept a single type, without losing existing functionality.

If you rely on our `import.meta.glob()` handling, we suggest adding the `pagesGlobToRssItems()` wrapper to your RSS config:

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

#### New `rssSchema` for content collections

`@astrojs/rss` now exposes an `rssSchema` for use with content collections. This ensures all RSS feed properties are present in your frontmatter:

```ts
import { defineCollection } from 'astro:content';
import { rssSchema } from '@astrojs/rss';

const blog = defineCollection({
  schema: rssSchema,
});

export const collections = { blog };
```
