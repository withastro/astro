---
'astro': major
---

Removes legacy content collection support.

This PR removes a number of APIs and options related to legacy content collections that were deprecated in Astro 5, including:

- The `legacy.collections` option, which was added in Astro 5 and caused the old content collections system to be used instead of the new one.
- Deprecated functions from `astro:content`: `getEntryBySlug` and `getDataEntryById` are both replaced by `getEntry()`, which is a drop-in replacement for both.
- Support for the old `src/content/config.*` file location. You must now use `src/content.config.*`.
- Automatically generating collections when a `src/content/` directory is present and no content config file exists. You must now explicitly define collections in `src/content.config.*`.
- Support for collections without a loader. You must now use the `glob()` loader to create collections from filesystem content. This will also mean that generated entries use the new entry format:
  - The `id` field is now a slug, not a filename. You can access the filename via `entry.filePath`, which is the path relative to the site root.
  - There is no longer a `slug` field – use `id` instead.
  - You can no longer call `entry.render()` on content entries. Use `render(entry)` instead, imported from `astro:content`.

For full details, see [the Astro 6 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v6/#removed-legacy-content-collections).
