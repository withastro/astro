---
'astro': minor
---

Adds a new `security.serverIslandBodySizeLimit` configuration option

Server island POST endpoints now enforce a body size limit, similar to the existing `security.actionBodySizeLimit` for Actions. The new option defaults to `1048576` (1 MB) and can be configured independently.

Requests exceeding the limit are rejected with a 413 response. You can customize the limit in your Astro config:

```js
export default defineConfig({
  security: {
    serverIslandBodySizeLimit: 2097152, // 2 MB
  },
})
```
