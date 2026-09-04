---
'astro': patch
---

Fixes non-deterministic filenames for fonts from the `local` provider. Font file IDs are now hashed from the file content only, not the absolute file path and content, so the same font produces the same `/_astro/fonts/<hash>.<ext>` URL across machines and CI checkouts.