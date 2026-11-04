---
'@astrojs/vue': minor
---

Adds a `@astrojs/vue/renderer` export: the Vue renderer as plain data, for projects that use `@astrojs/vite-plugin-astro` without the `astro` CLI. Add `@vitejs/plugin-vue` next to it. `vue({ appEntrypoint })` sets up the app of every island, as the integration's option does; `vueJsxRenderer()` renders Vue components compiled by `@vitejs/plugin-vue-jsx`.

```js
// vite.config.js
import astro from '@astrojs/vite-plugin-astro';
import vue from '@astrojs/vue/renderer';
import viteVue from '@vitejs/plugin-vue';

export default { plugins: [astro({ renderers: [vue({ appEntrypoint: './src/app.ts' })] }), viteVue()] };
```
