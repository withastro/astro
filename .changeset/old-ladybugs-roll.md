---
'@astrojs/image': minor
---

Adds a new built-in image service based on web assembly libraries :drum: web container support!

**Migration:** Happy with the previous image service based on [`sharp`](https://sharp.pixelplumbing.com/)? No problem! Install `sharp` in your project and update your Astro config to match.

```sh
npm install sharp
```

```astro title="astro.config.mjs"
---
import image from '@astrojs/image';

export default {
  // ...
  integrations: [image({
    serviceEntryPoint: '@astrojs/image/sharp'
  })],
}
---
```
