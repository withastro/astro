---
'astro': patch
---

Fixes `astro dev status` and other background server commands deleting the lock file of a running dev or preview server when run from a sandbox or as another user that is not permitted to signal its process
