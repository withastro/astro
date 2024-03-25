---
"astro": minor
"@astrojs/mdx": minor
---

Add `allowMd` boolean option, which makes `.md` files parsed as MDX as well.

vite-plugin-mdx no longer early returns on `.md` files, as they may need to be parsed as JSX.
