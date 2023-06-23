---
'astro': minor
---

Astro exposes the middleware file path to the integrations in the hook `astro:build:done`

```ts
// myIntegration.js
import type { AstroIntegration } from 'astro';
function integration(): AstroIntegration {
    return {
        name: "fancy-astro-integration",
        hooks: {
            'astro:build:done': ({ middlewarePath }) => { 
                if (middlewarePath) {
                    // do some operations
                }
            }
        }
    }
}
```

The `middlewarePath` is only defined if the user has created an Astro middleware.
