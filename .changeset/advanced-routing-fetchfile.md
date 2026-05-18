---
'astro': patch
---

Adds `fetchFile` option to `experimental.advancedRouting` to customize or disable the entrypoint file

```js
export default defineConfig({
  experimental: {
    advancedRouting: {
      fetchFile: 'fetch.ts',
    },
  },
});
```
