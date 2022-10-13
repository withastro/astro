---
'@astrojs/vue': minor
---

Add support for the `appEntrypoint` option, which accepts a root-relative path to an app entrypoint. The default export of this file should be a function that accepts a Vue `App` instance prior to rendering. This opens up the ability to extend the `App` instance with [custom Vue plugins](https://vuejs.org/guide/reusability/plugins.html).

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  integrations: [
    vue({
      appEntrypoint: '/src/pages/_app'
    })
  ]
})
```

```js
// src/pages/_app.ts
import type { App } from 'vue';
import i18nPlugin from '../plugins/i18n'

export default function setup(app: App) {
  app.use(i18nPlugin, { /* options */ })
}
```
