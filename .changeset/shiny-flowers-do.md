---
'astro': minor
---

Adds experimental `getCollectionsMetadata()`, which lists the content collections of your project without loading their entries.

With the new `experimental.collectionMetadata` flag, `getCollectionsMetadata()` from `astro:content` returns every build-time and live collection, with its name, its type, the name of its loader, and its descriptors:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    collectionMetadata: true,
  },
});
```

Descriptors are serializable values that let code recognize a collection without knowing its name. Loaders declare them with a `descriptors` property, typed by the `Loader` and `LiveLoader` generics, and you can add or override them with the `descriptors` option of `defineCollection()` and `defineLiveCollection()`. `getCollectionsMetadata()` returns the descriptors of each collection with their types, so editors autocomplete them:

```ts
// a library's loader
export function docsLoader(): Loader<{ myDocs: 'docs' }> {
  return {
    name: 'my-docs-loader',
    descriptors: { myDocs: 'docs' },
    load: async (context) => {
      // ...
    },
  };
}
```

```ts
// a page injected by the same library
import { getCollection, getCollectionsMetadata } from 'astro:content';

const docs = (await getCollectionsMetadata())
  .filter((collection) => collection.type === 'build-time')
  .filter((collection) => collection.descriptors.myDocs === 'docs');

for (const { name } of docs) {
  const entries = await getCollection(name);
}
```

To give TypeScript the collections you found, use the `CollectionMetadataWith` type in a type guard. It keeps the collections that have the descriptors you pass, and optionally one type of collection:

```ts
import type { CollectionMetadata, CollectionMetadataWith } from 'astro:content';

type DocsCollection = CollectionMetadataWith<{ myDocs: 'docs' }, 'build-time'>;

function isDocsCollection(collection: CollectionMetadata): collection is DocsCollection {
  return collection.type === 'build-time' && collection.descriptors.myDocs === 'docs';
}
```

For more information on enabling and using this feature in your project, see the [experimental collection metadata docs](https://docs.astro.build/en/reference/experimental-flags/collection-metadata/).

To share feedback on this feature, comment on the [enhanced content collections RFC](https://github.com/withastro/roadmap/pull/1459).
