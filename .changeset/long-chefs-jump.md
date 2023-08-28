---
'astro': patch
---

The scrollend mechanism is a better way to record the scroll position compared to throttling, so we now use it whenever a browser supports it.