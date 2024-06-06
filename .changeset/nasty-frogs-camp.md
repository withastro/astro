---
'astro': patch
---

Adds support for enums to `astro:env`

You can now call `envField.enum`:

```js
import { defineConfig, envField } from 'astro/config'

export default defineConfig({
    experimental: {
        env: {
            schema: {
                API_VERSION: envField.enum({
                    context: 'server',
                    access: 'secret',
                    values: ['v1', 'v2'],
                })
            }
        }
    }
})
```
