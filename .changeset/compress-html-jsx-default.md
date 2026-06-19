---
'astro': major
---

Makes `'jsx'` the default value for `compressHTML`

Astro now strips whitespace from your HTML using JSX rules by default, the same way frameworks like React do. Whitespace and line breaks around elements are removed, but meaningful whitespace within a single line — like a space between two inline elements — is preserved. To keep a space that would otherwise be removed, write it explicitly in your source, for example with `{" "}`.

This can change rendered output where whitespace between inline elements was previously meaningful. To keep Astro's earlier behavior, set `compressHTML: true` for HTML-aware compression, or `compressHTML: false` to preserve all whitespace.
