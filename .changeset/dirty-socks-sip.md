---
'@astrojs/markdown-remark': minor
'astro': minor
---

Adds a [`markdown.shikiConfig.langAlias` option](https://shiki.style/guide/load-lang#custom-language-aliases) that allows aliasing a non-supported code language to a known language.

For example, the below configuration tells shiki to highlight `cjs` code blocks using the `javascript` syntax highlighter:

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

````md
```cjs
'use strict';

function commonJs() {
  return 'I am a commonjs file';
}
```
````
