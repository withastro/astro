---
'astro': patch
---

Defers Vite manifest cleanup until all `buildApp` hooks have completed, allowing platform plugins to consume the manifests.
