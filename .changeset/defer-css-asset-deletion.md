---
'astro': patch
---

Fix an issue where CSS for conditionally-rendered island components could be dropped in production builds under Rolldown (Vite 8) due to reassigning to the bundle object in `generateBundle`.
