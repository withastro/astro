---
'astro': minor
---

Removes the setting `experimental.queuedRendering`. The new rendering engine is now stable and replaces the old one.

As part of the stabilization, the queued rendering has been improved, and some features have been removed:
- The construction of the queue has been removed, instead now Astro uses a streaming approach where components are rendered and flushed as they are encountered.
- The node polling feature has been removed because it doesn't yield concrete savings.
- The content cache has been descoped, and how only tag names are cached.
If you were previously using this experimental feature, you must remove this experimental flag from your configuration as it no longer exists:
```diff
// astro.config.mjs
import { defineConfig } from "astro/config";

export default defineConfig({
  experimental: {
-    queuedRendering: {}
  }
});
```
