---
'@astrojs/mdx': patch
---

[@astrojs/mdx] Added self-injected exported components when rendering `Content` component

Rendering the `Content` component imported from an MDX file would render
differently from rendering as MDX page, because the mapping from
`export const components = { h1: Title, ...}` would not be respected.

This fix will inject the `components` into the `Content`.

Closes #5027
