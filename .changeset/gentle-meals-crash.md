---
'astro': major
---

Remove support for `Astro.__renderMarkdown` which is used by `@astrojs/markdown-component`. 

The `<Markdown />` component was deprecated in Astro v1 and is completely removed in v3. This integration must now be removed from your project.

As an alternative, you can use community packages that provide a similar component like https://github.com/natemoo-re/astro-remote instead.
