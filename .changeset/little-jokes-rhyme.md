---
'astro': patch
---

Fix cookies set after middleware did a rewrite with `next(url)` not being applied
