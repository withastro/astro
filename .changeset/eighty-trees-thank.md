---
'astro': minor
---

This PR introduces a new internal CSS parser for `@astrojs/compiler`. See [`withastro/compiler#329`](https://github.com/withastro/compiler/pull/329) for more details.

This fixes Astro's support for modern CSS syntax like `@container`, `@layer`, and nesting. **Note** While Astro now correctly parses this modern syntax, it does not automatically compile features for browser compatability purposes.
