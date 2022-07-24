---
'@astrojs/image': patch
---

Switched etag dependency to etag-webcrypto, this should allow the production endpoint to function on Vercel Edge Functions.
