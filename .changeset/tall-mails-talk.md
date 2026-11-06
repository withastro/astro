---
'astro': minor
'@astrojs/mdx': minor
---

Adds the metadata of the content collection to the data of Markdown plugins compiling MDX and `deferRender` entries.

With the experimental `collectionMetadata` flag enabled, remark, rehype and Sätteri plugins can read `file.data.astro.collection` when they compile an MDX entry, or a Markdown entry loaded with `deferRender: true`. A file loaded by more than one collection is compiled once for all of them, so its collection is left `undefined`.

For more information on enabling and using this feature in your project, see the [experimental collection metadata docs](https://docs.astro.build/en/reference/experimental-flags/collection-metadata/).

To share feedback on this feature, comment on the [enhanced content collections RFC](https://github.com/withastro/roadmap/pull/1459).
