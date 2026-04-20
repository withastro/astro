---
'astro': patch
---

Fixes content collection `glob()` loader IDs to respect schema-transformed frontmatter `slug` values such as `z.string().slugify()`
