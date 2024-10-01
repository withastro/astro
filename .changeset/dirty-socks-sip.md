---
'@astrojs/markdown-remark': minor
'astro': minor
---

Adds a configuration called https://shiki.style/guide/load-lang#custom-language-aliases, that allows a non-supported code language to a known language.

This option requires `langs` to be defined with the correct values. The option will tell shiki which language to load when mapping the alias.

The below example will tell shiki to highlight the code blocks `cjs` using the `javascript` syntax highlighting, The `langs` list will contain the `javascript` language.  

```js
import { defineConfig } from "astro/config";

export default defineConfig({
  markdown: {
    shikiConfig: {
      langAlias: {
        cjs: "javascript"
      },
      langs: ['javascript']
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

Failing to define `langs` will result in an error:

```
Error [ShikiError]: Failed to parse Markdown file "undefined":
Language `cjs` not found, you may need to load it first 
```
