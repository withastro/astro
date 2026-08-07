---
'astro': patch
---

Fixes a regression where content collection `reference()` fields silently accepted entry IDs that don't exist, such as an ID that doesn't match a loader's slugified version of it. Astro now logs an error for references that point to a missing entry after all loaders finish syncing.
