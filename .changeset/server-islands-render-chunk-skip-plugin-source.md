---
'astro': patch
---

Fixes an issue where `renderChunk` in `vite-plugin-server-islands` replaced server island placeholder markers in chunks bundling the plugin itself (such as `create-vite.js` via `astro/config`), breaking the constant definition into an unterminated string.
