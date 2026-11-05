---
'astro': minor
---

Adds experimental access to the collections of a build in the `astro:build:done` integration hook.

With the experimental `collectionMetadata` flag enabled, `astro:build:done` receives the metadata of the build-time collections, and their entries, for example to validate or post-process content after a build:

```js
export default function myIntegration() {
  return {
    name: 'my-integration',
    hooks: {
      'astro:build:done': async ({ collections }) => {
        const docs = collections.metadata.filter((collection) => collection.descriptors.myDocs === 'docs');
        for (const { name } of docs) {
          const entries = await collections.entries(name, { content: false });
        }
      },
    },
  };
}
```

`entries()` returns the entries as the build's sync wrote them, with references and images unresolved. With `{ content: false }`, entries are returned without `body` and `rendered`. Live collections have no entries at build time.

For more information on enabling and using this feature in your project, see the [experimental collection metadata docs](https://docs.astro.build/en/reference/experimental-flags/collection-metadata/).

To share feedback on this feature, comment on the [enhanced content collections RFC](https://github.com/withastro/roadmap/pull/1459).
