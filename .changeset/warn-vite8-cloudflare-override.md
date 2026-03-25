---
'astro': patch
---

Warns on dev server startup when Vite 8 is detected at the top level of the user's project, and automatically adds a `"overrides": { "vite": "^7" }` entry to `package.json` when running `astro add cloudflare`. This prevents a `require_dist is not a function` crash caused by a Vite version split between Astro (requires Vite 7) and packages like `@tailwindcss/vite` that hoist Vite 8.
