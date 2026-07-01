---
'@astrojs/netlify': minor
---

Adds `edgeFunctions` to the `devFeatures` adapter option, allowing users to disable Netlify Edge Function emulation during `astro dev`

Some npm packages that access the filesystem at initialization (e.g. `node-html-parser`) fail inside the edge function sandbox with "Reading or writing files with Edge Functions is not supported yet." You can now disable edge function emulation to avoid this error:

```js
import netlify from "@astrojs/netlify";
import { defineConfig } from "astro/config";

export default defineConfig({
  adapter: netlify({
    devFeatures: {
      edgeFunctions: false,
    },
  }),
});
```

Edge functions will still work in production builds and via `netlify dev`.
