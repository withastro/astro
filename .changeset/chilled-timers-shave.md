---
'astro': patch
---

**BREAKING CHANGE to experimental content layer loaders only!**

Passes `AstroConfig` instead of `AstroSettings` object to content layer loaders.

This will not affect you unless you have created a loader that uses the `settings` object. If you have, you will need to update your loader to use the `config` object instead.

```diff
export default function myLoader() {
  return {
    name: 'my-loader'
-   async load({ settings }) {
-     const base = settings.config.base;
+   async load({ config }) {
+     const base = config.base;
      // ...
    }
  }
}

```

Other properties of the settings object are private internals, and should not be accessed directly. If you think you need access to other properties, please open an issue to discuss your use case.
