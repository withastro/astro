# @astrojs/solid-js-renderer

The Solid renderer of Astro components: it server-renders Solid components used in `.astro` files and hydrates them as islands. It is plain data for `astro()` from [`@astrojs/vite-plugin-astro`](../../vite-plugin-astro/), in a Vite project without the `astro` CLI. Astro projects use [`@astrojs/solid-js`](../../integrations/solid/), which registers this renderer.

```js
// vite.config.js
import astro from '@astrojs/vite-plugin-astro';
import solid from '@astrojs/solid-js-renderer';
import viteSolid from 'vite-plugin-solid';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [astro({ renderers: [solid()] }), viteSolid({ ssr: true })],
});
```

Compiling Solid components is the job of `vite-plugin-solid`, added to the Vite `plugins` next to `astro()`.
