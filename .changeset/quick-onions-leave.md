---
'astro': patch
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

Legacy data collections are handled like this:

- a `glob` loader collection is defined, with patterns that match the previous handling (matches `src/content/<collection name>/**/*{.json,.yaml}` and other data extensions, with underscore-prefixed files and folders ignored)
- Entries have an ID that is not slugified
- `getDataEntryById` is supported

While this backwards compatibility implementation is able to emulate most of the features of legacy collections, there are some differences and limitations that may cause breaking changes to existing collections:

- Implicit collections for folders in `src/content` are only defined if no other collections use content layer. If no content layer collections are defined, and there are folders in `src/content` that don't match collections in `src/content/config.ts` then collections will be auto-generated for them. This is not recommended, and a warning will be logged that this is deprecated. A collection should always be defined in `config.ts`. For legacy collections these can just be empty declarations: e.g.`const blog = defineCollection({})`. 
- The special `layout` field is not supported in Markdown collection entries. This property is intended only for standalone page files located in `src/pages/` and not likely to be in your collection entries. However, if you were using this property, you must now create dynamic routes that include your page styling.
- Sort order of generated collections is non-deterministic and platform-dependent.
- `image().refine()` is not supported
- the key for `getEntry` is typed as `string`, rather than having types for every entry.

A new config flag `legacy.collections` is added for users that need the old behavior. When set, collections in `src/content` are processed in the same way as before rather than being implemented with glob - including implicit collections. When set, content layer collections are forbidden in `src/content`, and will fail a build if defined.
