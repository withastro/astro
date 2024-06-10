---
'astro': patch
---

Adds additional validation options to `astro:env`

`astro:env` schema datatypes `string` and `number` now have new optional validation rules:

```js
import { defineConfig, envField } from 'astro/config'

export default defineConfig({
    experimental: {
        env: {
            schema: {
                FOO: envField.string({
                    // ...
                    max: 32,
                    min: 3,
                    length: 12,
                    url: true,
                    includes: 'foo',
                    startsWith: 'bar',
                    endsWith: 'baz'
                }),
                BAR: envField.number({
                    // ...
                    gt: 2,
                    min: 3,
                    lt: 10,
                    max: 9,
                    int: true
                })
            }
        }
    }
})
```