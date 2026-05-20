---
'@astrojs/node': patch
---

Fixes a crash on startup when deploying to Firebase Hosting. `resolveClientDir()` now returns `null` instead of throwing when the `server` directory segment cannot be found in the runtime path (e.g. Firebase flattens `dist/server/` contents to a root directory). Disk-based prerendered error pages are skipped gracefully in that case.
