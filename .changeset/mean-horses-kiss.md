---
'astro': minor
---

Adds a new [`injectTypes()` utility](https://docs.astro.build/en/reference/integrations-reference/#injecttypes-options) to the Integration API and refactors how type generation works

Use `injectTypes()` in the `astro:config:done` hook to inject types into your user's project by adding a new a `*.d.ts` file.

The `filename` property will be used to generate a file at `/.astro/integrations/<normalized_integration_name>/<normalized_filename>.d.ts` and must end with `".d.ts"`.

The `content` property will create the body of the file, and must be valid TypeScript.

Additionally, `injectTypes()` returns a URL to the normalized path so you can overwrite its content later on, or manipulate it in any way you want.

```js
// my-integration/index.js
export default {
  name: 'my-integration',
  'astro:config:done': ({ injectTypes }) => {
    injectTypes({
      filename: "types.d.ts",
      content: "declare module 'virtual:my-integration' {}"
    })
  }
};
```

Codegen has been refactored. Although `src/env.d.ts` will continue to work as is, we recommend you update it:

```diff
- /// <reference types="astro/client" />
+ /// <reference path="../.astro/types.d.ts" />
- /// <reference path="../.astro/env.d.ts" />
- /// <reference path="../.astro/actions.d.ts" />
```