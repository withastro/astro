---
'astro': patch
---

Adds a `"overrides": { "vite": "^7" }` entry to `package.json` when running `astro add tailwind`. Prevents npm from hoisting Vite 8 via `@tailwindcss/vite`'s permissive peer-dependency range, which causes `astro build` to fail with `Missing field 'tsconfigPaths' on BindingViteResolvePluginConfig.resolveOptions`. Mirrors #16062 for the tailwind case.
