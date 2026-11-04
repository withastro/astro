---
'@astrojs/solid-js': minor
---

Adds a `@astrojs/solid-js/renderer` export: the Solid renderer as plain data, for projects that use `@astrojs/vite-plugin-astro` without the `astro` CLI. Add `vite-plugin-solid` with `ssr: true` next to it.

```js
// vite.config.js
import solid from '@astrojs/solid-js/renderer';
import astro from '@astrojs/vite-plugin-astro';
import viteSolid from 'vite-plugin-solid';

export default { plugins: [astro({ renderers: [solid()] }), viteSolid({ ssr: true })] };
```
