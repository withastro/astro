---
'@astrojs/markdown-remark': minor
'astro': minor
---

Adds support for `excludeLangs` to allow users to customize syntax highlighting behavior to exclude languages from syntax highlighting. This is useful when rendering markdown that contains code blocks with specific languages with integrations that depend on the code not being highlighted, such as mermaid diagrams. Mermaid diagrams are rendered using the code block with the language `mermaid`. Syntax highlighting introduces additional code blocks with the language `astro` and `html` to wrap the diagram, which is redundant when the diagram is rendered using a different integration.

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

