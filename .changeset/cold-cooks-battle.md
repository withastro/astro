---
'@astrojs/node': minor
---

Allows disabling HTML streaming

Astro [streams HTML](https://docs.astro.build/en/guides/on-demand-rendering/#html-streaming) by default, which helps with performance by allowing the user to see parts of the page as soon as possible. In most cases, you should keep using this behavior.

However, you may have to disable HTML streaming, for example, if your host only supports non streamed HTML caching at the CDN level. You can opt out of the default behavior:

```diff
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  adapter: node({
    mode: 'standalone',
+    experimentalDisableStreaming: true,
  }),
});
```
