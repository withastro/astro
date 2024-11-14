---
'astro': minor
---

Adds a new `astro:routes:resolved` hook to the Integration API. Makes updates to the `astro:build:done` hook by deprecating `routes` and adding a new `assets` map

When building an integration, you can now get access to routes inside the `astro:routes:resolved` hook:

```js
const integration = () => {
    return {
        name: 'my-integration',
        hooks: {
            'astro:routes:resolved': ({ routes }) => {
                console.log(routes)
            }
        }
    }
}
```

This hook runs before `astro:config:done`, and whenever a route changes in development.

The `routes` array from `astro:build:done` are now deprecated. Any useful property is made available on `astro:routes:resolved`, except for `distURL`. Instead, you can use the newly exposed `assets` map::

```diff
const integration = () => {
+    let routes
    return {
        name: 'my-integration',
        hooks: {
+            'astro:routes:resolved': (params) => {
+                routes = params.routes
+            },
            'astro:build:done': ({
-                routes
+                assets
            }) => {
+                for (const route of routes) {
+                    const distURL = assets.get(route.pattern)
+                    if (distURL) {
+                        Object.assign(route, { distURL })
+                    }
+                }
                console.log(routes)
            }
        }
    }
}
```