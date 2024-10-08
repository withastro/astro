---
'@astrojs/markdown-remark': minor
'astro': minor
---

Adds a `markdown.shikiConfig.langAlias` option that allows [aliasing a non-supported code language to a known language](https://shiki.style/guide/load-lang#custom-language-aliases). This is useful when the language of your code samples is not [a built-in Shiki language](https://shiki.style/languages), but you want your Markdown source to contain an accurate language while also displaying syntax highlighting.

The following example configures Shiki to highlight `cjs` code blocks using the `javascript` syntax highlighter:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
    shikiConfig: {
      langAlias: {
        cjs: 'javascript',
      },
    },
  },
});
```

Then in your Markdown, you can use the alias as the language for a code block for syntax highlighting:

````md
```cjs
'use strict';

function commonJs() {
  return 'I am a commonjs file';
}
```
````
