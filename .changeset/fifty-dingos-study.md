---
'astro': minor
---

Updates the Adapter API to allow providing a `serverEntrypoint` when using `entryType: 'self'`

Astro 6 introduced a new powerful yet simple Adapter API for defining custom server entrypoints. You can now call `setAdapter()` with the `entryType: 'self'` option and specify your custom `serverEntrypoint`:

```js
export function myAdapter() {
    return {
        name: 'my-adapter',
        hooks: {
            'astro:config:done': ({ setAdapter }) => {
                setAdapter({
                    name:'my-adapter',
                    entryType: 'self',
                    serverEntrypoint: 'my-adapter/server.js',
                    supportedAstroFeatures: {
                        // ...
                    }
                })
            }
        }
    }
}
```

If you need further customization at the Vite level, you can omit `serverEntrypoint` and instead specify your custom server entrypoint with [`vite.build.rollupOptions.input`](https://rollupjs.org/configuration-options/#input).
