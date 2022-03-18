---
'astro': minor
---

This PR introduces a new internal CSS parser for `@astrojs/compiler`. This should fix support for modern CSS syntax features like `@container`, `@layer`, and nesting. Note that while these syntax features are now parsed correctly, they are not automatically down-leveled.
