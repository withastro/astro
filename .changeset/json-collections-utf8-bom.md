---
'astro': patch
---

Fixes JSON content collection entries that start with a UTF-8 byte order mark (BOM). The `glob()` loader no longer throws `DataCollectionEntryParseError` for these files, and the `file()` loader no longer drops the whole collection.
