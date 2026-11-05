---
'astro': minor
---

Adds an experimental `astro:collections:resolved` integration hook, which receives the metadata of the build-time content collections of the project.

With the `experimental.collectionMetadata` flag enabled, integrations can learn about the collections of a project before any loader runs, for example to configure Markdown plugins for the collections they recognize. The hook is called during the content sync, after `astro:config:done`:

- In `astro build`, on every build, before `astro:build:start`. The build hasn't loaded any module with Vite yet, except the modules your content config imports, which are loaded to read it.
- In `astro dev`, after `astro:server:setup` and before `astro:server:start`, and again when the content config changes.

```js
export default function myIntegration() {
  return {
    name: 'my-integration',
    hooks: {
      'astro:collections:resolved': ({ collections }) => {
        const docs = collections.filter((collection) => collection.descriptors.myDocs === 'docs');
      },
    },
  };
}
```

For more information on enabling and using this feature in your project, see the [experimental collection metadata docs](https://docs.astro.build/en/reference/experimental-flags/collection-metadata/).

To share feedback on this feature, comment on the [enhanced content collections RFC](https://github.com/withastro/roadmap/pull/1459).
