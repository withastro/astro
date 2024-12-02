---
'astro': major
---

Removes internal JSX handling and moves the responsibility to the `@astrojs/mdx` package directly. The following exports are also now removed:

- `astro/jsx/babel.js`
- `astro/jsx/component.js`
- `astro/jsx/index.js`
- `astro/jsx/renderer.js`
- `astro/jsx/server.js`
- `astro/jsx/transform-options.js`

If your project includes `.mdx` files, you must upgrade `@astrojs/mdx` to the latest version so that it doesn't rely on these entrypoints to handle your JSX.
