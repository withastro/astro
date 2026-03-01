---
'@astrojs/node': patch
'astro': patch
---

Adds a new `security.actionBodySizeLimit` option to configure the maximum size of Astro Actions request bodies.

This lets you increase the default 1 MB limit when your actions need to accept larger payloads. For example, actions that handle file uploads or large JSON payloads can now opt in to a higher limit.

If you do not set this option, Astro continues to enforce the 1 MB default to help prevent abuse.

```js
// astro.config.mjs
export default defineConfig({
  security: {
    actionBodySizeLimit: 10 * 1024 * 1024 // set to 10 MB
  }
})
```
