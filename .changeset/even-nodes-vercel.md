---
'@astrojs/vercel': patch
---

Fixes builds on Node.js 26 and later even-numbered Node.js versions silently deploying functions on `nodejs24.x`. The adapter now uses the runtime matching the Node.js version of the build, instead of a hard-coded list of versions.
