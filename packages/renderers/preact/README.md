# @astrojs/preact-renderer

The Preact renderer of Astro components: it server-renders Preact components used in `.astro` files and hydrates them as islands. It is plain data for `astro()` from [`@astrojs/vite-plugin-astro`](../../vite-plugin-astro/), in a Vite project without the `astro` CLI. Astro projects use [`@astrojs/preact`](../../integrations/preact/), which registers this renderer.

```js
// vite.config.js
import astro from '@astrojs/vite-plugin-astro';
import preact from '@astrojs/preact-renderer';
import { preact as vitePreact } from '@preact/preset-vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [astro({ renderers: [preact()] }), vitePreact()],
});
```

Compiling Preact components is the job of `@preact/preset-vite`, added to the Vite `plugins` next to `astro()`.
