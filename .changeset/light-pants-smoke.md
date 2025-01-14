---
'astro': minor
---

Adds support for configured external redirects:

```js 
// astro.config.mjs
import {defineConfig} from "astro/config"

export default defineConfig({
  redirects: {
    "/blog": "https://example.com/blog",
    "/news": {
      status: 302,
      destination: "https://example.com/news" 
    }
  }
})
```
