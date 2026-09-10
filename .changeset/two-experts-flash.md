---
'astro': patch
---

Fixes a bug where the `glob()` content loader kept stale entries in the data store after the last file in a collection was deleted. Empty collections are now pruned correctly, and the file watcher is registered in dev so the first file added to an empty collection is picked up without a restart.