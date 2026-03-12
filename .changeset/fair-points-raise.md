---
'astro': patch
---

Avoid a `MaxListenersExceededWarning` during `astro dev` startup by increasing the shared Vite watcher listener limit when attaching content server listeners.
