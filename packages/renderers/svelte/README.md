# @astrojs/svelte-renderer

The Svelte renderer of Astro components: it server-renders Svelte components used in `.astro` files and hydrates them as islands. It is plain data for `astro()` from [`@astrojs/vite-plugin-astro`](../../vite-plugin-astro/), in a Vite project without the `astro` CLI. Astro projects use [`@astrojs/svelte`](../../integrations/svelte/), which registers this renderer.

```js
// vite.config.js
import astro from '@astrojs/vite-plugin-astro';
import svelte from '@astrojs/svelte-renderer';
import { svelte as viteSvelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [astro({ renderers: [svelte()] }), viteSvelte()],
});
```

Compiling Svelte components is the job of `@sveltejs/vite-plugin-svelte`, added to the Vite `plugins` next to `astro()`.
