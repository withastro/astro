---
"astro": minor
---

Adds a new `image.dangerouslyProcessSVG` flag to optionally enable processing SVG inputs. For security reasons, Astro will no longer rasterizes SVG image sources by default in its default image service and endpoint.

Set `image.dangerouslyProcessSVG: true` to opt back into processing SVG inputs.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  // ...
  image: {
    dangerouslyProcessSVG: true,
  },
});
```

Note that this is a breaking change for users who were previously relying on Astro's default image service to rasterize SVG inputs, but it is a necessary change to improve security and prevent potential vulnerabilities.
