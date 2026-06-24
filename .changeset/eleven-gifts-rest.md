---
'astro': patch
---

Fixes HMR not working on pages without component imports by ensuring head content (including `/@vite/client`) is flushed after rendering completes, even when `maybeRenderHead` is never called
