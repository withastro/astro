---
"@astrojs/react": minor
---

Adds experimental support for disabling streaming

```diff
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [
    react({
+      experimentalDisableStreaming: true,
    }),
  ],
});
```
