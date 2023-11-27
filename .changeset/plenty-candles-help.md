---
'astro': major
---

Removes support for Shiki custom language's `path` property. The language JSON file should be imported and passed to the option instead.

```diff
// astro.config.js
+ import customLang from './custom.tmLanguage.json'

export default defineConfig({
  markdown: {
    shikiConfig: {
      langs: [
-       { path: './custom.tmLanguage.json' },
+       customLang,
      ],
    },
  },
})
```
