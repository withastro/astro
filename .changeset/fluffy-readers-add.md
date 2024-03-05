---
"@astrojs/internal-helpers": minor
"astro": minor
---

Adds the option to pass an object to `build.assetsPrefix`. This allows for the use of multiple CDN prefixes based on the target filetype.

When defining `build.assetsPrefix` as a object, the object must accept a key named `fallback`, which is used when as asset doesn't match an extension.

Each key of the object must match the extension of the file. 

```js
// astro.config.mjs
import { defineConfig } from "astro/config"

export default defineConfig({
    build: {
        assetsPrefix: {
            'js': "https://js.cdn.example.com",
            'mjs': "https://js.cdn.example.com", // if you have .mjs files, you must add a new entry like this
            "png": "https://images.cdn.example.com",
            'fallback': "https://generic.cdn.example.com"
        }
    }
})
```
