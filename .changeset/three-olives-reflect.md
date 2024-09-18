---
'astro': minor
---

Adds `codegenDir` to integrations `astro:config:setup` hook

In 4.14, we introduced `injectTypes` on `astro:config:done`. Under the hood, it creates a file at `<root>/.astro/integrations/<normalized_integration_name>`.

In this release, the folder URL is now available in `astro:config:setup` as `codegenDir`. It allows you to have space without risking being overriden by another integration, Astro or overriding another integration. This directory is always created before any hook so it's safe to write files directly:

```js
import { writeFileSync } from 'node:fs'

const integration = {
    name: 'my-integration',
    hooks: {
        'astro:config:setup': ({ codegenDir }) => {
            writeFileSync(new URL('cache.json', codegenDir), '{}', 'utf-8')
        }
    }
}
```
