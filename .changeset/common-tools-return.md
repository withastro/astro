---
'astro': patch
---

Fixes `astro dev` incorrectly starting in background mode for Warp terminal users. Hybrid environments like Warp are no longer treated as AI agents for auto-background detection.
