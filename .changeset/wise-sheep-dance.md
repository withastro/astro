---
'astro': patch
---

Fixes `experimental.contentIntellisense` so that the collections manifest (`.astro/collections/collections.json`) is updated when content files are added or removed during dev, without requiring a server restart. Also fixes a secondary bug where deleted files were never removed from the manifest.
