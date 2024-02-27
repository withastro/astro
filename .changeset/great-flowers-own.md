---
"astro": patch
---

Fixes an issue where multiple injected routes with the same `entrypoint` but different `pattern` were incorrectly cached, causing some of them not being rendered in the dev server.
