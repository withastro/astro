---
'astro': major
---

Removes internal JSX handling as they are now handled by `@astrojs/mdx` directly. The below exports are also now removed:

- `astro/jsx/babel.js`
- `astro/jsx/component.js`
- `astro/jsx/index.js`
- `astro/jsx/renderer.js`
- `astro/jsx/server.js`
- `astro/jsx/transform-options.js`

Make sure to upgrade `@astrojs/mdx` to latest so that it doesn't rely on these entrypoints.
