---
'astro': patch
---

Fixes server-side `.wasm` imports (`.wasm?init`) failing in production builds, by keeping the module next to the server code that reads it instead of only moving it to the client directory
