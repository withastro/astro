---
'astro': patch
---

Improves development server startup time for projects using content collections. The experimental JavaScript dev server exposes a `contentReady` promise for consumers that need to wait for initial content synchronization
