---
'astro': patch
---

Fixes an issue in the rewriting logic where old data was not purged during the rewrite flow. This caused some false positives when checking the validity of URL path names during the rendering phase.
