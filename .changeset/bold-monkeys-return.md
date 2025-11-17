---
'@astrojs/internal-helpers': patch
'astro': patch
---

Changes the remote protocol checks for images to require explicit authorization in order to use data URIs.

In order to allow data URIs for remote images, you will need to update your `astro.config.mjs` file to include the following configuration:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  images: {
    remotePatterns: [
      {
        protocol: 'data',
      },
    ],
  },
});
```
