---
'@astrojs/markdown-remark': minor
'astro': minor
---

Adds a new configuration option for Markdown syntax highlighting `excludeLangs` 

This option provides better support for diagramming tools that rely on Markdown code blocks, such as Mermaid.js and D2 by allowing you to exclude specific languages from Astro's default syntax highlighting.

This option allows you to avoid rendering conflicts with tools that depend on the code not being highlighted without forcing you to disable syntax highlighting for other code blocks.

The default value for `excludeLangs` is `['math']` and remains unchanged by default in this release.
But users can now override it to exclude other languages or exclude no languages.

The following example configuration will exclude highlighting for `mermaid` and `math` code blocks:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid', 'math'],
    },
  },
});
```

