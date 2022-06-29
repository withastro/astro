---
'@astrojs/preact': minor
---

Add support for enabling `preact/compat` to Preact renderer

To use `preact/compat` to render React components, users can now set `compat` to `true` when using the Preact integration:

```js
integrations: [
  preact({ compat: true }),
],
```
