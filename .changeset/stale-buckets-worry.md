---
'astro': patch
---

When the same SVG file was imported by multiple pages or components, the build pipeline called `emitFile()` for every occurrence.  
That created duplicate (or hard-linked) SVGs inside `dist/_astro/`.  
for example—reject hard links, causing deployment failures (see #13910).

Compute the first 16 hex chars of the SVG’s `SHA-256` hash. If that hash is already in the cache, reuse the existing handle instead of emitting a new file.

Store the mapping `hash → emitFile handle` in a `WeakMap`. During long dev-server sessions, entries whose keys are no longer referenced are garbage-collected automatically, preventing memory leaks.

each unique SVG is written only once.
