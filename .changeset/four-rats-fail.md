---
'astro': patch
---

Fixes a bug where the `filePath` property was not available on content collection entries when using the content layer `file()` loader with a JSON file that contained an object instead of an array. This was breaking use of the `image()` schema utility among other things.
