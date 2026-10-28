---
'@astrojs/react': minor
---

Adds a `@astrojs/react/renderer` export: the React renderer as plain data, for projects that use `@astrojs/vite-plugin-astro` without the `astro` CLI. Add `@vitejs/plugin-react` next to it.

```js
// vite.config.js
import react from '@astrojs/react/renderer';
import astro from '@astrojs/vite-plugin-astro';
import viteReact from '@vitejs/plugin-react';

export default { plugins: [astro({ renderers: [react()] }), viteReact()] };
```
