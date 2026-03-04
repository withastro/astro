---
'astro': minor
---

Adds `preserveBuildClientDir` option to adapter features

Adapters can now opt in to preserving the client/server directory structure for static builds by setting `preserveBuildClientDir: true` in their adapter features. When enabled, static builds will output files to `build.client` instead of directly to `outDir`.

This is useful for adapters that require a consistent directory structure regardless of the build output type, such as deploying to platforms with specific file organization requirements.

```js
// my-adapter/index.js
export default function myAdapter() {
  return {
    name: 'my-adapter',
    hooks: {
      'astro:config:done': ({ setAdapter }) => {
        setAdapter({
          name: 'my-adapter',
          adapterFeatures: {
            buildOutput: 'static',
            preserveBuildClientDir: true
          }
        });
      }
    }
  };
}
```