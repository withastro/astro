---
'astro': minor
---

Allows passing URL entrypoints when configuring the logger

Matching other APIs like session drivers or font providers, the logger entrypoint can now be a URL:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  logger: {
    entrypoint: new URL("./logger.js", import.meta.url),
  }
});
```
