---
'astro': minor
---

Adds a new `astro:routes:resolved` hook to the Integration API, and deprecates `routes` passed to `astro:build:done`

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

`routes` from `astro:build:done` is now deprecated. We recommend you use the new hook instead:

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
            }) => {
                console.log(routes)
            }
        }
    }
}
```