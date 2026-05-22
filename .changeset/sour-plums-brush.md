---
'astro': minor
---

Adds `experimental.portableOutput` option to make the build `dist/` directory portable

When enabled, the `dist/` output can be moved to a different machine or directory and run
with `node dist/server/entry.mjs` without rebuilding. This enables building in CI and
deploying the artifact elsewhere, cross-platform builds (e.g., build on Windows, deploy on
Linux), and caching build outputs across CI runs with tools like Turborepo.

```js
// astro.config.mjs
export default defineConfig({
  experimental: {
    portableOutput: true,
  },
});
```

`node_modules/` must be co-located with `dist/` at the deployment target.
