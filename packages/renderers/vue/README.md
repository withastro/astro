# @astrojs/vue-renderer

The Vue renderer of Astro components: it server-renders Vue components used in `.astro` files and hydrates them as islands. It is plain data for `astro()` from [`@astrojs/vite-plugin-astro`](../../vite-plugin-astro/), in a Vite project without the `astro` CLI. Astro projects use [`@astrojs/vue`](../../integrations/vue/), which registers this renderer.

```js
// vite.config.js
import astro from '@astrojs/vite-plugin-astro';
import vue from '@astrojs/vue-renderer';
import viteVue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [astro({ renderers: [vue()] }), viteVue()],
});
```

Compiling Vue components is the job of `@vitejs/plugin-vue`, added to the Vite `plugins` next to `astro()`.
