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

- No implicit collections. In order to be generated, a collection must be defined in `config.ts`. For legacy collections these can just be empty declarations: e.g.`const blog = defineCollection({})`. Removing implicit collections means that we can allow content layer collections in `src/content`.
- The `layout` field is not supported in Markdown
- Experimental content collection cache is not supported
- Sort order of generated collections is non-deterministic and platform-dependent.
- `image().refine()` is not supported
- the key for `getEntry` is typed as `string`, rather than having types for every entry.

A new config flag `legacy.legacyContentCollections` is added for users that need the old behavior. When set, collections in `src/content` are processed in the same way as before rather than being implemented with glob - including implicit collections. When set, content layer collections are forbidden in `src/content`, and will fail a build if defined.
