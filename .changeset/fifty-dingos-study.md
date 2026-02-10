---
'astro': minor
---

Updates the Adapter API to allow providing a `serverEntrypoint` when using `entryType: 'self'`

Astro 6 introduced a new powerful yet simple Adapter API for defining custom server entrypoints. You can now call `setAdapter()` with the new `entryType: 'self'` option and specify your custom `serverEntrypoint`:

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
