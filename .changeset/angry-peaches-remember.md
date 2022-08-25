---
'@astrojs/react': minor
---

Uses startTransition on React roots

This prevents hydration from blocking the main thread when multiple islands are rendering at the same time.
