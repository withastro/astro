---
'@astrojs/vercel': patch
---

Fix Vercel serverless path override handling so override values are only applied when the trusted middleware secret is present.
