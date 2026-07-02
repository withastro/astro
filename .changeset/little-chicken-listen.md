---
'astro': patch
---

Fixes island component paths so that extensionless imports (e.g. `import { Counter } from '../components/Counter'`) resolve to the real file on disk, matching Vite's extension order and directory `index` resolution. This makes the `include`/`exclude` options of JSX renderer integrations (React, Preact, Solid) match components imported without a file extension, and removes the spurious React 19 "Invalid hook call" warning logged on every request in dev when `include` was set alongside another JSX renderer
