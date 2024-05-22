---
"@astrojs/vue": minor
---

Updates the `devtools` type to allow passing `VueDevToolsOptions`

For more customization, you can pass options that the [Vue DevTools Vite Plugin](https://devtools-next.vuejs.org/guide/vite-plugin#options) supports. (Note: `appendTo` is not supported.) For example, you can set `launchEditor` to your preferred editor if you are not using Visual Studio Code:

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import vue from "@astrojs/vue";

export default defineConfig({
  // ...
  integrations: [
    vue({
      devtools: { launchEditor: "webstorm" },
    }),
  ],
});
```
