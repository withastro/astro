---
'@astrojs/node': patch
---

Fixes an infinite loop in `resolveClientDir()` when the server entry point is bundled with esbuild or similar tools. The function now throws a descriptive error instead of hanging indefinitely when the expected server directory segment is not found in the file path.
