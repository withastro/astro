---
'astro': minor
---

Adds an experimental `experimental.treeShakeComponents` flag that excludes the styles and scripts of Astro components that a page imports but never renders.

When composing pages from data, such as when building pages from CMS "page builder" blocks, a page often imports every possible component and selects which one to render at runtime. Astro cannot know which components are used while bundling, so their styles and scripts were included even when unused. With this flag, Astro records which components each page actually renders and only writes the styles and scripts of those components.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    treeShakeComponents: true,
  },
});
```

Only styles owned by Astro components are affected. Page-level styles, global styles, and styles of framework components (for example Svelte or Vue components) are always kept.

On-demand rendered pages opt out of streaming while this flag is enabled, because Astro must render the whole page to know which components were used.
