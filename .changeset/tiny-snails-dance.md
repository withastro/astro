---
'astro': minor
---

Adds an opt-in way to minify the HTML output.

Using the `compressHTML` option Astro will remove whitespace from Astro components. This only applies to components written in `.astro` format and happens in the compiler to maximize performance. You can enable with:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  compressHTML: true
});
```

Compression occurs both in development mode and in the final build.
