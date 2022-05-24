---
'astro': patch
'@astrojs/markdown-remark': minor
---

Significantally more stable behavior for "Markdown + Components" usage, which now handles component serialization much more similarly to MDX. Also supports switching between Components and Markdown without extra newlines, removes wrapping `<p>` tags from standalone components, and improves JSX expression handling.
