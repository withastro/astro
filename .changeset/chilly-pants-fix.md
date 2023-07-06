---
'astro': minor
---

Astro exposes the middleware file path to the integrations in the hook `astro:build:ssr`

```ts
// myIntegration.js
import type { AstroIntegration } from 'astro';
function integration(): AstroIntegration {
    return {
        name: "fancy-astro-integration",
        hooks: {
            'astro:build:ssr': ({ middlewareEntryPoint }) => { 
                if (middlewareEntryPoint) {
                    // do some operations
                }
            }
        }
    }
}
```

The `middlewareEntryPoint` is only defined if the user has created an Astro middleware.
