---
'@astrojs/markdown-remark': major
'astro': major
---

Cleans up Astro-specfic metadata attached to `vfile.data` in Remark and Rehype plugins. Previously, the metadata was attached in different locations with inconsistent names. The metadata is now renamed as below:

- `vfile.data.__astroHeadings` -> `vfile.data.astro.headings`
- `vfile.data.imagePaths` -> `vfile.data.astro.imagePaths`

The types of `imagePaths` has also been updated from `Set<string>` to `string[]`. The `vfile.data.astro.frontmatter` metadata is left unchanged.

While we don't consider these APIs public, they can be accessed by Remark and Rehype plugins that want to re-use Astro's metadata. If you are using these APIs, make sure to access them in the new locations.
