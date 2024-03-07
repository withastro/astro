---
"@astrojs/internal-helpers": minor
"astro": minor
---

Adds the option to pass an object to `build.assetsPrefix`. This allows for the use of multiple CDN prefixes based on the target file type.

When passing an object to `build.assetsPrefix`, you must also specify a `fallback` domain to be used for all other file types not specified.

Specify a file extension as the key (e.g. 'js', 'png') and the URL serving your assets of that file type as the value:

```js
// astro.config.mjs
import { defineConfig } from "astro/config"

export default defineConfig({
    build: {
        assetsPrefix: {
            'js': "https://js.cdn.example.com",
            'mjs': "https://js.cdn.example.com", // if you have .mjs files, you must add a new entry like this
            'png': "https://images.cdn.example.com",
            'fallback': "https://generic.cdn.example.com"
        }
    }
})
```
