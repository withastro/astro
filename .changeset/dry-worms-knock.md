---
'astro': major
---

The `image.endpoint` config now allow customizing the route of the image endpoint in addition to the entrypoint. This can be useful in niche situations where the default route `/_image` conflicts with an existing route or your local server setup.

```js
import { defineConfig } from "astro/config";

defineConfig({
  image: {
    endpoint: {
      route: "/image",
      entrypoint: "./src/image_endpoint.ts"
    }
  },
})
```
