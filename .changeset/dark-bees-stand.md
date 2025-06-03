---
'astro': minor
---

Provides a Markdown renderer to content loaders

When creating a content loader, you will now have access to a `renderMarkdown` function that allows you to render Markdown content directly within your loaders. It uses the same settings and plugins as the renderer used for Markdown files in Astro, and follows any Markdown settings you have configured in your Astro project.

This allows you to render Markdown content from various sources, such as a CMS or other data sources, directly in your loaders without needing to preprocess the Markdown content separately.

```ts
import type { Loader } from 'astro/loaders';
import { loadFromCMS } from './cms';

export function myLoader(settings): Loader {
  return {
    name: 'my-loader',
    async load({ renderMarkdown, store }) {
      const entries = await loadFromCMS();

      store.clear();

      for (const entry of entries) {
        // Assume each entry has a 'content' field with markdown content
        store.set(entry.id, {
          id: entry.id,
          data: entry,
          rendered: await renderMarkdown(entry.content),
        });
      }
    },
  };
}
```

The return value of `renderMarkdown` is an object with two properties: `html` and `metadata`. These match the `rendered` property of content entries in content collections, so you can use them to render the content in your components or pages.

```astro
---
import { getEntry, render } from 'astro:content';
const entry = await getEntry('my-collection', Astro.params.id);
const { Content } = await render(entry);
---
<Content />
```

For more information, see the [Content Loader API docs](https://docs.astro.build/en/reference/content-loader-reference/#rendermarkdown).
