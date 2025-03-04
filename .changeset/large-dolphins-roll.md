---
'@astrojs/markdown-remark': minor
'astro': minor
---

Adds support for `excludeLangs` in `syntaxHighlight`. This allows users to exclude languages from syntax highlighting. This is useful when rendering markdown that contains code blocks with specific languages which has integrations that depend on the language not being highlighted, such as mermaid diagrams.

The default value for `excludeLangs` is `['math']` and is unchanged in this release.

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

