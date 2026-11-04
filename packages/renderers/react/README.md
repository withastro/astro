# @astrojs/react-renderer

The React renderer of Astro components: it server-renders React components used in `.astro` files and hydrates them as islands. It is plain data for `astro()` from [`@astrojs/vite-plugin-astro`](../../vite-plugin-astro/), in a Vite project without the `astro` CLI. Astro projects use [`@astrojs/react`](../../integrations/react/), which registers this renderer.

```js
// vite.config.js
import astro from '@astrojs/vite-plugin-astro';
import react from '@astrojs/react-renderer';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [astro({ renderers: [react()] }), viteReact()],
});
```

Compiling React components is the job of `@vitejs/plugin-react`, added to the Vite `plugins` next to `astro()`.
