---
'astro': minor
---

Adds an option for the Sharp image service to allow large images to be processed. Set `limitInputPixels: false` to bypass the default image size limit:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
  },
});
```
