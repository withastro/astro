---
'astro': minor
---

Adds a new `middlewareMode` adapter feature to replace the previous `edgeMiddleware` option.

This feature only impacts adapter authors. If your adapter supports `edgeMiddleware`, you should upgrade to the new `middlewareMode` option to specify the middleware mode for your adapter as soon as possible. The `edgeMiddleware` feature is deprecated and will be removed in a future major release.

```diff
export default function createIntegration() {
  return {
    name: '@example/my-adapter',
    hooks: {
      'astro:config:done': ({ setAdapter }) => {
        setAdapter({
          name: '@example/my-adapter',
          serverEntrypoint: '@example/my-adapter/server.js',
          adapterFeatures: {
-            edgeMiddleware: true
+            middlewareMode: 'edge'
          }
        });
      },
    },
  };
}
```
