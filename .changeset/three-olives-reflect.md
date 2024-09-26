---
'astro': minor
---

Adds a new `createCodegenDir()` function to the `astro:config:setup` hook in the Integrations API

In 4.14, we introduced the `injectTypes` utility on the `astro:config:done` hook. It can create `.d.ts` files and make their types available to user's projects automatically. Under the hood, it creates a file in `<root>/.astro/integrations/<normalized_integration_name>`.

While the `.astro` directory has always been the preferred place to write code generated files, it has also been prone to mistakes. For example, you can write a `.astro/types.d.ts` file, breaking Astro types. Or you can create a file that overrides a file created by another integration.

In this release, `<root>/.astro/integrations/<normalized_integration_name>` can now be retrieved in the `astro:config:setup` hook by calling `createCodegenDir()`. It allows you to have a dedicated folder, avoiding conflicts with another integration or Astro itself. This directory is created by calling this function so it's safe to write files to it directly:

```js
import { writeFileSync } from 'node:fs'

const integration = {
    name: 'my-integration',
    hooks: {
        'astro:config:setup': ({ createCodegenDir }) => {
            const codegenDir = createCodegenDir()
            writeFileSync(new URL('cache.json', codegenDir), '{}', 'utf-8')
        }
    }
}
```
