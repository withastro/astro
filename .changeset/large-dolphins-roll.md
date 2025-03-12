---
'@astrojs/markdown-remark': minor
'astro': minor
---

Adds a new configuration option for Markdown syntax highlighting `excludeLangs` 

This option provides better support for diagramming tools that rely on Markdown code blocks, such as Mermaid.js and D2 by allowing you to exclude specific languages from Astro's default syntax highlighting.

This option allows you to avoid rendering conflicts with tools that depend on the code not being highlighted without forcing you to disable syntax highlighting for other code blocks.

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

Read more about this new option in the [Markdown syntax highlighting configuration docs](https://docs.astro.build/en/reference/configuration-reference/#markdownsyntaxhighlight).
