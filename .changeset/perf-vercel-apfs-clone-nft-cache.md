---
'@astrojs/vercel': patch
---

On macOS, use `cp -rc` (APFS copy-on-write via `clonefile(2)`) for large directory copies in the Vercel adapter, and add a persistent cache for the NFT dependency trace keyed by `sha256(package-lock.json)`. Both changes fall back gracefully on non-macOS platforms.
