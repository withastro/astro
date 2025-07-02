---
'@astrojs/node': minor
---

Adds a new experimental configuration option `experimentalDisableStreaming` to allow you to opt out of Astro's default [HTML streaming](https://docs.astro.build/en/guides/on-demand-rendering/#html-streaming) for pages rendered on demand.

HTML streaming helps with performance and generally provides a better visitor experience. In most cases, disabling streaming is not recommended.

However, when you need to disable HTML streaming (e.g. your host only supports non-streamed HTML caching at the CDN level), you can now opt out of the default behavior:

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
