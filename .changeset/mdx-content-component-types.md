---
'astro': patch
'@astrojs/mdx': patch
---

Adds TypeScript support for the `components` prop on MDX `Content` component when using `await render()`. Developers now get proper intellisense and type checking when passing custom components to override default MDX element rendering.
