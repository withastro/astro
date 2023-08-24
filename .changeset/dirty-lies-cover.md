---
'@astrojs/cloudflare': minor
'@astrojs/netlify': minor
'@astrojs/vercel': minor
'@astrojs/deno': minor
'@astrojs/node': minor
'astro': minor
---

Introduced the concept of feature map. A feature map is a list of features that are built-in in Astro, and an Adapter
can tell Astro if it can support it.

```ts
import {AstroIntegration} from "./astro";

function myIntegration(): AstroIntegration {
    return {
        name: 'astro-awesome-list',
        // new feature map
        supportedAstroFeatures: {
            hybridOutput: 'experimental',
            staticOutput: 'stable',
            serverOutput: 'stable',
            assets: {
                supportKind: 'stable',
                isSharpCompatible: false,
                isSquooshCompatible: false,
            },
        }
    }
}
```
