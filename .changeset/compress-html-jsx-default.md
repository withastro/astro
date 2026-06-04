---
'astro': major
---

Makes `'jsx'` the default value for `compressHTML`

Astro now strips whitespace from your HTML using JSX rules by default, the same way frameworks like React do. Whitespace and line breaks between elements are removed unless you explicitly write them in your source, for example with `{" "}`.

This can change rendered output where whitespace between inline elements was previously meaningful. To keep Astro's earlier behavior, set `compressHTML: true` for HTML-aware compression, or `compressHTML: false` to preserve all whitespace.
