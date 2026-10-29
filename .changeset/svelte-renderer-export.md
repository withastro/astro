---
'@astrojs/svelte': minor
---

Adds a `@astrojs/svelte/renderer` export: the Svelte renderer as plain data, for projects that use `@astrojs/vite-plugin-astro` without the `astro` CLI. Add `@sveltejs/vite-plugin-svelte` next to it.

```js
// vite.config.js
import svelte from '@astrojs/svelte/renderer';
import astro from '@astrojs/vite-plugin-astro';
import { svelte as viteSvelte } from '@sveltejs/vite-plugin-svelte';

export default { plugins: [astro({ renderers: [svelte()] }), viteSvelte()] };
```
