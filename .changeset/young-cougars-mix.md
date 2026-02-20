---
'astro': minor
---

Make action request body size limits configurable via `security.actionBodySizeLimit`.

```js
// astro.config.mjs
export default defineConfig({
  security: {
    actionBodySizeLimit: 10 * 1024 * 1024 // set to 10 MB
  }
})
```
