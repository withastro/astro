---
'@astrojs/react': patch
---

Fixes `<link rel="stylesheet">`, `preconnect`, and `dns-prefetch` tags rendered by a React component being stripped from its server-rendered island HTML. Only the preloads React 19 injects automatically are removed, and nothing is removed with React 18.
