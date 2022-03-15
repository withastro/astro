---
'astro': patch
---

Add an `astro/config` entrypoint with a `defineConfig` utility.

Config files can now be easily benefit from Intellisense using the following approach:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  renderers: []
})
```
