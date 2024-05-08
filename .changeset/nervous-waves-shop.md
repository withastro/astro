---
"astro": minor
---

Adds support for passing an inline Astro configuration object to `getViteConfig()`

If you are using `getViteConfig()` to configure the Vitest test runner, you can now pass a second argument to control how Astro is configured. This makes it possible to configure unit tests with different Astro options when using [Vitest’s workspaces](https://vitest.dev/guide/workspace.html) feature.

```js
// vitest.config.ts
import { getViteConfig } from 'astro/config';

export default getViteConfig(
  /* Vite configuration */
  { test: {} },
  /* Astro configuration */
  {
    site: 'https://example.com',
    trailingSlash: 'never',
  },
);
```
