---
'astro': major
---

Refactors legacy `content` and `data` collections to use the Content Layer API `glob()` loader for better performance and to support backwards compatibility. Also introduces the `legacy.collections` flag for projects that are unable to update to the new behavior immediately.

:warning: **BREAKING CHANGE FOR LEGACY CONTENT COLLECTIONS** :warning:

By default, collections that use the old types (`content` or `data`) and do not define a `loader` are now implemented under the hood using the Content Layer API's built-in `glob()` loader, with extra backward-compatibility handling.

In order to achieve backwards compatibility with existing `content` collections, the following have been implemented:

- a `glob` loader collection is defined, with patterns that match the previous handling (matches `src/content/<collection name>/**/*.md` and other content extensions depending on installed integrations, with underscore-prefixed files and folders ignored)
- When used in the runtime, the entries have an ID based on the filename in the same format as legacy collections
- A `slug` field is added with the same format as before
- A `render()` method is added to the entry, so they can be called using `entry.render()`
- `getEntryBySlug` is supported

In order to achieve backwards compatibility with existing `data` collections, the following have been implemented:

- a `glob` loader collection is defined, with patterns that match the previous handling (matches `src/content/<collection name>/**/*{.json,.yaml}` and other data extensions, with underscore-prefixed files and folders ignored)
- Entries have an ID that is not slugified
- `getDataEntryById` is supported

While this backwards compatibility implementation is able to emulate most of the features of legacy collections, **there are some differences and limitations that may cause breaking changes to existing collections**:

- In previous versions of Astro, collections would be generated for all folders in `src/content/`, even if they were not defined in `src/content/config.ts`. This behavior is now deprecated, and collections should always be defined in `src/content/config.ts`. For existing collections, these can just be empty declarations (e.g. `const blog = defineCollection({})`) and Astro will implicitly define your legacy collection for you in a way that is compatible with the new loading behavior.
- The special `layout` field is not supported in Markdown collection entries. This property is intended only for standalone page files located in `src/pages/` and not likely to be in your collection entries. However, if you were using this property, you must now create dynamic routes that include your page styling.
- Sort order of generated collections is non-deterministic and platform-dependent. This means that if you are calling `getCollection()`, the order in which entries are returned may be different than before. If you need a specific order, you should sort the collection entries yourself.
- `image().refine()` is not supported. If you need to validate the properties of an image you will need to do this at runtime in your page or component.
- the `key` argument of `getEntry(collection, key)` is typed as `string`, rather than having types for every entry.

A new legacy configuration flag `legacy.collections` is added for users that want to keep their current legacy (content and data) collections behavior (available in Astro v2 - v4), or who are not yet ready to update their projects:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  legacy: {
    collections: true
  }
});
```

When set, no changes to your existing collections are necessary, and the restrictions on storing both new and old collections continue to exist: legacy collections (only) must continue to remain in `src/content/`, while new collections using a loader from the Content Layer API are forbidden in that folder.

