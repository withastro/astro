---
'astro': major
---

Sharp is now the default image service used for `astro:assets`. If you would prefer to still use Squoosh, you can update your config with the following:

```ts
import { defineConfig, squooshImageService } from "astro/config";

// https://astro.build/config
export default defineConfig({
  image: {
    service: squooshImageService(),
  }
})
```

However, not only do we recommend using Sharp as it is faster and more reliable, it is also highly likely that the Squoosh service will be removed in a future release.
