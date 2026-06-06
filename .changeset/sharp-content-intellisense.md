---
'astro': patch
---

Fixes the content intellisense manifest (`collections.json`) not updating when content files are added or removed during `astro dev`. The manifest is now regenerated on file add/unlink (debounced) and rebuilt from the current store so deleted entries are dropped instead of lingering.
