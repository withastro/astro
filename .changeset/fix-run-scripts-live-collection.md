---
'astro': patch
---

Fixes a crash in view transitions when `runScripts` iterates over a live `HTMLCollection` that shrinks mid-loop as scripts are moved into the document.
