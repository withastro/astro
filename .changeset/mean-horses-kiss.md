---
'astro': minor
---

Adds a new `injectTypes()` utility to the Integration API and refactors how type generation works

Integrations can now use a new `injectTypes()` utility in the `astro:config:done` hook. This utility allows an integration to inject types into a user's project. `filename` must end with `".d.ts"` and `content` must be valid TypeScript (it will be formatted).

Under the hood, it will create a file at `/.astro/integrations/<normalized_integration_name>/<normalized_filename>.d.ts` and create references to it. `injectTypes()` returns a URL to the normalized path.

```js
const path = injectTypes({
  filename: "types.d.ts",
  content: "declare module 'virtual:integration' {}"
})
console.log(path) // URL
```

Codegen has been refactored. Although `src/env.d.ts` will continue to work as is, we recommend you update it:

```diff
- /// <reference types="astro/client" />
+ /// <reference path="../.astro/types.d.ts" />
- /// <reference path="../.astro/env.d.ts" />
- /// <reference path="../.astro/actions.d.ts" />
```