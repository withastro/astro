---
'astro': minor
---

Adds experimental support for the content layer API.

The Content Layer API is a new way to handle content in Astro. It builds upon the content collections, taking them beyond local files in `src/content` and allowing you to fetch content from anywhere, including remote APIs, or files anywhere in your project. As well as being more powerful, the Content Layer is designed to be more performant, helping sites scale to thousands of pages. Data is cached between builds and updated incrementally. Markdown parsing is also 5-10x faster, and uses much less memory.

You can try content layer with your existing content, or try a custom loader.

### Migrating a markdown or MDX collection to content layer

You can try converting an existing content collection to content layer if it uses markdown or MDX, with these steps:

1. **Move the collection folder out of `src/content`.** This is so it won't be handled as a current content collection. This example assumes the content has been moved to `src/data`. The `config.ts` file must remain in `src/content`.
2. **Edit the collection definition**:

```diff
import { defineCollection, z } from 'astro:content';
+ import { glob } from 'astro/loaders';

const blog = defineCollection({
- type: 'content',
+ type: "experimental_content",
+ loader: glob({ pattern: "**/*.md", base: "./src/data/blog" }),	
  schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
	}),
});
```

3. **Change references from `slug` to `id`**. Content layer collections do not have a `slug` field by default. You should use `id` instead.

```diff
---
export async function getStaticPaths() {
	const posts = await getCollection('blog');
	return posts.map((post) => ({
-   params: { slug: post.slug },
+   params: { slug: post.id },
    props: post,
	}));
}
---
```

4. **Change references to markdown `headings` and switch to the new `render()` function**. Entries no longer have a `render()` method, as they are now serializable plain objects. Instead, import the `render()` function from `astro:content`. Markdown headings in content layer are not returned by `render()`, but are instead a property of `post.rendered.metadata`: 

```diff
---
- import { getEntry } from 'astro:content';
+ import { getEntry, render } from 'astro:content';

  const post = await getEntry('blog', params.slug);

- const { Content, headings } = await post.render();
+ const { Content } = await render(entry);
+ const headings = post.rendered?.metadata?.headings;
---

<Content />
```

The `getEntryBySlug` and `getDataEntryByID` functions are deprecated and cannot be used with content layer collections. Instead, use `getEntry`, which is a drop-in replacement for both.

### Creating a content layer loader

The simplest type of loader is an async function that returns an array of objects, each of which has an `id`:

```ts
const countries = defineCollection({
  type: "experimental_content",
  loader: async () => {
    const response = await fetch("https://restcountries.com/v3.1/all");
    const data = await response.json();
    // Must return an array of entries with an id property, or an object with IDs as keys and entries as values
    return data.map((country) => ({
      id: country.cca3,
      ...country,
    }));
  },
});

export const collections = { countries };
```

For more advanced loading logic, you can define an object loader. This allows incremental updates and conditional loading, and gives full access to the data store. See the API in [the draft RFC](https://github.com/withastro/roadmap/blob/content-layer/proposals/content-layer.md#loaders).
