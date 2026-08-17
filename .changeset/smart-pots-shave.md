---
'@astrojs/ts-plugin': patch
---

Fixes Astro's ambient types leaking into unrelated TypeScript projects. In a monorepo with hoisted `node_modules`, the plugin found the shared `astro` install from any project and injected `env.d.ts` and `astro-jsx.d.ts` into it, which pulled `@types/node` into projects that never asked for it. The plugin now only injects those types when the project actually depends on `astro` or has an `astro.config.*` file.
