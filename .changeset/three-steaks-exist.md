---
"@astrojs/react": minor
---

Adds experimental support for disabling streaming

This is useful to support libraries that are not compatible with streaming such as some CSS-in-JS libraries. To disable streaming for all React components in your project, set `experimentalDisableStreaming: true` as a configuration option for `@astrojs/react`:

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
