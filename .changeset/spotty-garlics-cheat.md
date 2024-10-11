---
'@astrojs/vercel': major
'@astrojs/node': major
'astro': major
---

Removed support for the Squoosh image service. As the underlying library `libsquoosh` is no longer maintained, and the image service sees very little usage we have decided to remove it from Astro.

Our recommendation is to use the base Sharp image service, which is more powerful, faster, and more actively maintained.

```diff
- import { squooshImageService } from "astro/config";
import { defineConfig } from "astro/config";

export default defineConfig({
-  image: {
-    service: squooshImageService()
-  }
});
```

If you are using this service, and cannot migrate to the base Sharp image service, a third-party extraction of the previous service is available here: https://github.com/Princesseuh/astro-image-service-squoosh
