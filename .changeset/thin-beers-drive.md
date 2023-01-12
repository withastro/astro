---
'astro': major
'@astrojs/mdx': major
'@astrojs/markdown-remark': major
---

Baseline the experimental `contentCollections` flag. You're free to remove this from your astro config!

```diff
import { defineConfig } from 'astro/config';

export default defineConfig({
- experimental: { contentCollections: true }
})
