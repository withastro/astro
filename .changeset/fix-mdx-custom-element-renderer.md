---
'astro': patch
---

Fixes custom elements in MDX files bypassing the renderer pipeline. Custom elements (tags containing hyphens like `<my-element>`) in `.mdx` files are now routed through registered renderers for SSR, matching the behavior of `.astro` files. If no renderer claims the element, it falls back to rendering as raw HTML.
