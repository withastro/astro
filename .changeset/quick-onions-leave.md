---
'astro': patch
---

Implements legacy content and data collections using `glob()` loader

:warning: **BREAKING CHANGE FOR LEGACY CONTENT COLLECTIONS** :warning:

By default, collections that use the the old types (content or data) are now implemented using the glob loader, with extra backward-compat handling. This includes any collection without a `loader` defined.

Any legacy content collections are handled like this:

- a `glob` loader collection is defined, with patterns that match the previous handling (matches `src/content/<collection name>/**/*.md` and other content extensions depending on installed integrations, with underscore-prefixed files and folders ignored)
- When used in the runtime, the entries have an ID based on the filename in the same format as legacy collections
- A `slug` field is added with the same format as before
- A `render()` method is added to the entry, so they can be called using `entry.render()`
- `getEntryBySlug` is supported

Legacy data collections are handled like this:

- a `glob` loader collection is defined, with patterns that match the previous handling (matches `src/content/<collection name>/**/*{.json,.yaml}` and other data extensions, with underscore-prefixed files and folders ignored)
- Entries have an ID that is not slugified
- `getDataEntryById` is supported

While these emulate most of the features of legacy collections, they have these differences:

- Implicit collections for folders in `src/content` are only defined if no other collections use content layer. If no content layer collections are defined, and there are folders in `src/content` that don't match collections in `src/content/config.ts` then collections will be auto-generated for them. This is not recommended, and a warning will be logged that this is deprecated. A collection should always be defined in `config.ts`. For legacy collections these can just be empty declarations: e.g.`const blog = defineCollection({})`. 
- The `layout` field is not supported in Markdown
- Sort order of generated collections is non-deterministic and platform-dependent.
- `image().refine()` is not supported
- the key for `getEntry` is typed as `string`, rather than having types for every entry.

A new config flag `legacy.collections` is added for users that need the old behavior. When set, collections in `src/content` are processed in the same way as before rather than being implemented with glob - including implicit collections. When set, content layer collections are forbidden in `src/content`, and will fail a build if defined.
