---
'astro': minor
---

Adds a new `retainBody` option to the `glob()` loader to allow reducing the size of the data store.

Currently, the `glob()` loader stores the raw body of each content file in the entry, in addition to the rendered HTML.

The `retainBody` option defaults to `true`, but you can set it to `false` to prevent the raw body of content files from being stored in the data store. This significantly reduces the deployed size of the data store and helps avoid hitting size limits for sites with very large collections.

The rendered body will still be available in the `entry.rendered.html` property for markdown files, and the `entry.filePath` property will still point to the original file.

```js
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/blog',
    retainBody: false
  }),
});
```

When `retainBody` is `false`, `entry.body` will be `undefined` instead of containing the raw file contents.
