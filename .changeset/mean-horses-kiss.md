---
'astro': minor
---

Adds a new `injectTypes` utility to the Integration API and refactors how typegen works

Integrations can now use a new `injectTypes` utility exposed on the `astro:config:done` hook. It allows to inject types easily in the user's project. `filename` must ends with `".d.ts"` and `content` must be valid TypeScript (it will be formatted).

Under the hood, it will create a file at `/.astro/integrations/<normalized_integration_name>/<normalized_filename>.d.ts` and create references to it. `injectTypes` returns a URL to the normalized path.

```js
const path = injectTypes({
  filename: "types.d.ts",
  content: "declare module 'virtual:integration' {}"
})
console.log(path) // URL
```

Codegen has been refactored. As a user, you just need to update `src/env.d.ts`:

```diff
- /// <reference types="astro/client" />
+ /// <reference path="../.astro/types.d.ts" />
- /// <reference path="../.astro/env.d.ts" />
- /// <reference path="../.astro/actions.d.ts" />
```