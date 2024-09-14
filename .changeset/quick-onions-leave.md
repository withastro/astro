---
'astro': patch
---

Implements legacy collections using `glob()` loader

Changes default behavior to emulate legacy content and data collections using content layer and the `glob()` loader if they are defined in the config. These emulated collections use `glob()`, with matching patterns to exclude underscores, but with the 

- Data collections have a non-slugified ID generated from the filename
- Content collections are stored with a new `legacyId` field based on the filename. When this is set on an entry the runtime returns an object that is compatible with legacy collections: the `id` is set to the legacy ID, the `slug` is set and an `entry.render()` method is set.

It does not support the `render` frontmatter field, and does not generate implicit collections for folders that don't have a defined collection.

It adds a `legacy.legacyContentCollections` flag which re-enables the behavior from 4.14: legacy collections are handled using the old code, and content layer collections can't be created in `src/content`.
