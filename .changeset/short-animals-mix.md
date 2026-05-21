---
'astro': patch
---

Adds `styleDirective.unsafeInline` option to CSP configuration. When set to `true`, Astro will emit `'unsafe-inline'` in the `style-src` directive and skip emitting style hashes, allowing inline styles to work. This is an opt-in escape hatch for projects that need `unsafe-inline` for styles while still benefiting from Astro's script hashing.
