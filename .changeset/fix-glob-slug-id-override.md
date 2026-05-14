---
'astro': patch
---

Fixes an issue where `CollectionEntry.id` would return the frontmatter `slug` value instead of the file-path-derived ID when using the `glob()` loader. The `slug` field in frontmatter is no longer treated as a special property for ID generation in modern content collections. Users who relied on frontmatter `slug` overriding the entry ID should use the `generateId` option instead.
