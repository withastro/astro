---
'astro': minor
---

The Content Layer API introduced behind a flag in [4.14.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#4140) is now stable and ready for use in Astro v5.0.

The new Content Layer API builds upon content collections, taking them beyond local files in `src/content/` and allowing you to fetch content from anywhere, including remote APIs. These new collections work alongside your existing content collections, and you can migrate them to the new API at your own pace. There are significant improvements to performance with large collections of local files. For more details, see [the Content Layer RFC](https://github.com/withastro/roadmap/blob/content-layer/proposals/0050-content-layer.md).

If you previously used this feature, you can now remove the `experimental.contentLayer` flag from your Astro config:

```diff
// astro.config.mjs
import { defineConfig } from 'astro'

export default defineConfig({
-  experimental: {
-    contentLayer: true
-  }
})
```

### Loading your content

The core of the new Content Layer API is the loader, a function that fetches content from a source and caches it in a local data store. Astro 4.14 ships with built-in `glob()` and `file()` loaders to handle your local Markdown, MDX, Markdoc, and JSON files:

```ts {3,7}
// src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
		 
const blog = defineCollection({
  // The ID is a slug generated from the path of the file relative to `base`
  loader: glob({ pattern: "**/*.md", base: "./src/data/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
  })
});

export const collections = { blog };
```

You can then query using the existing content collections functions, and use a simplified `render()` function to display your content:

```astro
---
import { getEntry, render } from 'astro:content';

const post = await getEntry('blog', Astro.params.slug);

const { Content } = await render(entry);
---

<Content />
```

### Creating a loader

You're not restricted to the built-in loaders – we hope you'll try building your own. You can fetch content from anywhere and return an array of entries:

```ts
// src/content/config.ts
const countries = defineCollection({
  loader: async () => {
    const response = await fetch("https://restcountries.com/v3.1/all");
    const data = await response.json();
    // Must return an array of entries with an id property,
    // or an object with IDs as keys and entries as values
    return data.map((country) => ({
      id: country.cca3,
      ...country,
    }));
  },
  // optionally add a schema to validate the data and make it type-safe for users
  // schema: z.object...
});

export const collections = { countries };
```

For more advanced loading logic, you can define an object loader. This allows incremental updates and conditional loading, and gives full access to the data store. It also allows a loader to define its own schema, including generating it dynamically based on the source API. See the [the Content Layer API RFC](https://github.com/withastro/roadmap/blob/content-layer/proposals/0050-content-layer.md#loaders) for more details.

### Sharing your loaders

Loaders are better when they're shared. You can create a package that exports a loader and publish it to npm, and then anyone can use it on their site. We're excited to see what the community comes up with! To get started, [take a look at some examples](https://github.com/ascorbic/astro-loaders/). Here's how to load content using an RSS/Atom feed loader:

```ts
// src/content/config.ts
import { defineCollection } from "astro:content";
import { feedLoader } from "@ascorbic/feed-loader";

const podcasts = defineCollection({
  loader: feedLoader({
    url: "https://feeds.99percentinvisible.org/99percentinvisible",
  }),
});

export const collections = { podcasts };
```

To learn more, see [the Content Layer RFC](https://github.com/withastro/roadmap/blob/content-layer/proposals/0050-content-layer.md).
