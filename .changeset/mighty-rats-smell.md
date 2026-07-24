---
'astro': patch
---

Fixes a bug where the glob loader with a negation pattern (`!docs/drafts/**`) in the dev server watcher would ingest unrelated files, causing unbounded data store growth. Negation patterns are now correctly excluded during file watching
