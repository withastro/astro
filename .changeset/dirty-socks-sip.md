---
'@astrojs/markdown-remark': minor
'astro': minor
---

Adds a configuration called https://shiki.style/guide/load-lang#custom-language-aliases, that allows a non-supported code language to a known language.
 
The below example will tell shiki to highlight the code blocks `cjs` using the `javascript` syntax highlighting.  

```js
import { defineConfig } from "astro/config";

export default defineConfig({
  markdown: {
    shikiConfig: {
      langAlias: {
        cjs: "javascript"
      }
    }
  }
})
```

``````md
```cjs
"use strict"

function commonJs() {
    return "I am a commonjs file"
}
```
``````
