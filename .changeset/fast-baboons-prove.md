---
'@astrojs/mdx': minor
---

Run heading ID injection after user plugins

⚠️ BREAKING CHANGE ⚠️

If you are using a rehype plugin that depends on heading IDs injected by Astro, the IDs will no longer be available when your plugin runs by default.

To inject IDs before your plugins run, import and add the `rehypeHeadingSlugs` plugin to your `rehypePlugins` config:

```diff
// astro.config.mjs
+ import { rehypeHeadingSlugs } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';

export default {
  integrations: [mdx()],
  markdown: {
    rehypePlugins: [
+     rehypeHeadingSlugs,
      otherPluginThatReliesOnHeadingIDs,
    ],
  },
}
```
