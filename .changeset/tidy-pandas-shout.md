---
'astro': patch
---

Fixes the `glob()` content loader swallowing Markdown rendering errors. A render failure during eager rendering is now re-thrown after logging, so `astro build` exits non-zero instead of reporting success with missing output
