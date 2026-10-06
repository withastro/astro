---
'astro': minor
---

Adds experimental support for saving content collections in an external storage, such as a database, instead of in Astro's data store

Astro saves the entries of all collections in its data store, which is bundled with your site and loaded in memory. With external storage, a driver saves the entries of the collections you choose, and Astro reads them from the driver only when your pages need them.

#### Configuring a driver

Set `experimental.collectionStorage` to `external`, and pass a driver. For example, `@astrojs/content-store-sqlite` saves collections in a SQLite or libSQL database:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { createContentCollectionStorage } from '@astrojs/content-store-sqlite';

export default defineConfig({
  experimental: {
    collectionStorage: {
      type: 'external',
      driver: createContentCollectionStorage({ url: 'file:content.db' }),
    },
  },
});
```

You can also write your own driver: a module whose default export is a function that returns a `ContentStorageDriver`, a type exported by `astro`. Pass its path or package name as `driver.entrypoint`, and its options as `driver.config`.

#### Choosing the collections to save

Add `storage: 'external'` to the collections that the driver should save. The other collections stay in the data store. External collections need a loader that supports external storage, such as the new `externalGlob()` and `externalFile()` loaders. They accept the same options as `glob()` and `file()`:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { externalGlob } from 'astro/loaders';

const blog = defineCollection({
  storage: 'external',
  loader: externalGlob({ base: './src/content/blog', pattern: '**/*.md' }),
});

export const collections = { blog };
```

`getCollection()`, `getEntry()` and `render()` work the same with external collections.

#### Reading entries without their content

The new `getCollectionMetadata()` function returns the entries of a collection without their `body` and rendered HTML, which are usually their largest part. Use it when you only need the data of the entries, for example to list them, or to create the paths of pages in `getStaticPaths()`:

```astro
---
import { getCollectionMetadata, getEntry, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollectionMetadata('blog');
  return posts.map((post) => ({ params: { id: post.id } }));
}

const post = await getEntry('blog', Astro.params.id);
const { Content } = await render(post);
---

<Content />
```

The entries returned by `getCollectionMetadata()` can't be passed to `render()`. Get the full entry with `getEntry()` first.

#### Supporting external storage in a loader

A loader supports external storage when it sets `supportsExternalStorage: true`. In external collections, the methods of `context.store` and `context.meta` return promises. Use `isExternalLoaderContext(context)` from `astro/loaders` to know which kind of store the loader received.
