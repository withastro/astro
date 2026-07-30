---
'astro': patch
---

Fix an `ENOENT` crash during file watching caused by IDEs rapidly creating and deleting temporary files on save.
