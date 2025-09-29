---
'@astrojs/sitemap': major
'astro': major
---

Removes `routes` on `astro:build:done` hook (Integration API)

In Astro 5.0, accessing `routes` on the `astro:build:done` hook was deprecated.

Astro 6.0 removes the `routes` array passed to this hook entirely. Instead, the `astro:routes:resolved` hook should be used. 

#### What should I do?

Remove any instance of `routes` passed to `astro:build:done` and replace it with the new `astro:routes:resolved` hook. Access `distURL` on the newly exposed `assets` map:

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
