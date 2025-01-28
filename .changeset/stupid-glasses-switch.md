---
'astro': minor
---

Adds a new experimental virtual module `astro:config` that exposes a type-safe subset of your `astro.config.mjs` configuration

The new virtual module exposes a type-safe sub-set configuration defined in `astro.config.mjs`.

The virtual module exposes two sub-paths:
- `astro:config/client`: exposes config information that are safe to expose to the client.
- `astro:config/server`: exposes additional information that is safe to expose to the server, such as file/dir paths.

To enable this new virtual module, an experimental flag must be turned on:

```js
// astro.config.mjs
import {defineConfig} from "astro/config"
export default defineConfig({
  experimental: {
    serializeManifest: true
  }
})
```

Then, you can use the module in any file inside the Astro project

```js
// src/utils.js
import { trailingSlash } from "astro:config/client";

function addForwardSlash(path) {
  if (trailingSlash === "always") {
    return path.endsWith("/") ? path : path + "/"
  } else {
    return path
  }
}

```

