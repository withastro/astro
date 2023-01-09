---
'astro': minor
'@astrojs/mdx': minor
'@astrojs/markdown-remark': minor
---

Introduce a `smartypants` flag to opt-out of Astro's default SmartyPants plugin.

```js
{
  markdown: {
    smartypants: false,
  }
}
```

  #### Migration
  
  You may have disabled Astro's built-in plugins (GitHub-Flavored Markdown and Smartypants) with the `extendDefaultPlugins` option. This has now been split into 2 flags to disable each plugin individually:
  - `markdown.gfm` to disable GitHub-Flavored Markdown
  - `markdown.smartypants` to disable SmartyPants

  ```diff
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({
    markdown: {
  -   extendDefaultPlugins: false,
  +   smartypants: false,
  +   gfm: false,
    }
  });
  ```
