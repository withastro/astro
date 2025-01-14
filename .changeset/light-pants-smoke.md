---
'astro': minor
---

Adds support for external redirects `astro.config.mjs`:

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
