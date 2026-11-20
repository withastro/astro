---
'astro': minor
'@astrojs/runtime': patch
---

Adds `experimental.lazyAssets` to include an Astro component's styles only when the component renders.

Enable this option when your pages import components that they conditionally render:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    lazyAssets: true,
  },
});
```

Use ordinary component imports. Shared styles are included once per page. The option works in development, for prerendered pages, and for on-demand pages while preserving streaming. Styles discovered after the document head are emitted before the component's content.
