---
'astro': patch
---

Inline `process.env` boolean values (`0`, `1`, `true`, `false`) during the build. This helps with DCE and allows for better `export const prerender` detection.
