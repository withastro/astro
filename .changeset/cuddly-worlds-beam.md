---
'astro': major
---

Removes `routes` on `astro:build:done` hook (Integration API)

In Astro 5.0, accessing `routes` on the `astro:build:done` hook was deprecated in favour of a new `astro:routes:resolved` hook. However, Astro integrations may have continued to function using the `routes` array.

Astro 6.0 removes the `routes` array passed to this hook entirely. Instead, the `astro:routes:resolved` hook must be used. 

#### What should I do?

Remove any instance of `routes` passed to `astro:build:done` in your Astro integration and replace it with the new `astro:routes:resolved` hook. You can access `distURL` on the newly exposed `assets` map:

```diff
// my-integration.mjs
const integration = () => {
+   let routes
    return {
        name: 'my-integration',
        hooks: {
+           'astro:routes:resolved': (params) => {
+               routes = params.routes
+           },
            'astro:build:done': ({
-               routes
+               assets
            }) => {
+               for (const route of routes) {
+                   const distURL = assets.get(route.pattern)
+                   if (distURL) {
+                       Object.assign(route, { distURL })
+                   }
+               }
                console.log(routes)
            }
        }
    }
}
```
