---
'astro': minor
---

Updates the Adapter API to allow providing a `serverEntrypoint` when using `entryType: 'self'`

Astro 6 introduced a new Adapter API by calling calling `setAdapter()` with `entryType: 'self'`. This way, the server entrypoint had to be provided as a Rollup input. This was great because it allowed more powerful usages but it made it harder to make simpler adapters.

The server entrypoint can now be provided as `serverEntrypoint` when calling `setAdapter()`:

```diff
export function myAdapter() {
    return {
        name: 'my-adapter',
        hooks: {
-            'astro:config:setup': ({ updateConfig }) => {
-                updateConfig({
-                    vite: {
-                        build: {
-                            rollupOptions: {
-                                input: 'my-adapter/server.js'
-                            }
-                        }
-                    }
-                })
-            },
            'astro:config:done': ({ setAdapter }) => {
                setAdapter({
                    name:'my-adapter',
                    entryType: 'self',
+                    serverEntrypoint: 'my-adapter/server.js',
                    supportedAstroFeatures: {
                        // ...
                    }
                })
            }
        }
    }
}
```

If `serverEntrypoint` not set, Astro still expects a Rollup input.
