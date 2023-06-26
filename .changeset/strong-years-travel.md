---
'astro': minor
---

Introduced a new build option for SSR, called `build.excludeMiddleware`.

```js
// astro.config.mjs
import {defineConfig} from "astro/config";

export default defineConfig({
    build: {
        excludeMiddleware: true
    }
})
```

When enabled, the code that belongs to be middleware **won't** be imported
by the final pages/entry points. The user is responsible to import it and 
call it manually.
