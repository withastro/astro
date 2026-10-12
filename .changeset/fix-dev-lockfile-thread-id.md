---
'astro': patch
---

Fixes an issue where `astro dev` could mistake a Linux thread ID for a running server and refuse to start or kill an unrelated process
