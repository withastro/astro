---
'@astrojs/preact': minor
---

Adds a `@astrojs/preact/renderer` export: the Preact renderer as plain data, for projects that use `@astrojs/vite-plugin-astro` without the `astro` CLI. Add `@preact/preset-vite` next to it.

```js
// vite.config.js
import preact from '@astrojs/preact/renderer';
import astro from '@astrojs/vite-plugin-astro';
import { preact as vitePreact } from '@preact/preset-vite';

export default { plugins: [astro({ renderers: [preact()] }), vitePreact()] };
```
