---
'create-astro': patch
---

Fixes `create-astro` silently writing template files to the wrong directory on Linux when the path contains non-ASCII characters.
