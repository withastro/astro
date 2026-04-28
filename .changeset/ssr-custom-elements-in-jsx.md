---
"astro": patch
---

Custom elements (tags with hyphens) in MDX files are now routed through the renderer pipeline for SSR, matching the behavior of the `.astro` compiler. Previously, custom elements in MDX bypassed all registered renderers and were output as raw HTML strings.