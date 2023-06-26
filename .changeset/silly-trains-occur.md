---
'astro': minor
---

The hook `astro:build:done` now accepts a new property called `entryPoints`.

`entryPoints` is defined as `Map<RouteData, URL>`. The key difference between this 
property and the one provided in the hook `astro:build:ssr`, is that these
URLs map the physical files **after** they are moved in the server destination
folder.

```js
export function itegration(): AstroIntegration {
    return {
        name: "my-integration",
        hooks: {
            "astor:build:done": ({ entryPoints }) => {
                // do something with entry points
            }
        }
    }
}
```
