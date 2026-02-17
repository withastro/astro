---
'astro': patch
---

Create new `middlewareMode` adapter feature that replaces `edgeMiddleware` option.

This feature only impacts adapter developers. If your adapter supports `edgeMiddleware`, you should now use the new `middlewareMode` option to specify the middleware mode for your adapter. The `edgeMiddleware` feature is deprecated and will be removed in a future release.

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
