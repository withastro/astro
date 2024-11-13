---
'astro': minor
---

Adds a new `astro:routes:resolved` hook to the Integration API, and deprecates most `routes` properties passed to `astro:build:done`

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

Most `routes` properties from `astro:build:done` are now deprecated. We recommend you use the new hook instead:

```diff
const integration = () => {
+    let routes
    return {
        name: 'my-integration',
        hooks: {
+            'astro:routes:resolved': (params) => {
+                routes = params.routes
+            },
            'astro:build:done': (params) => {
+                for (const _route of params.routes) {
+                    const route = routes.find(r => r.pattern === _route.route)
+                    if (route) {
+                        route.distURL = _route.distURL
+                    }
+                }
                console.log(routes)
            }
        }
    }
}
```