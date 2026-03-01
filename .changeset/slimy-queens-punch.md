---
'astro': patch
---

Fixes `inferSize` being kept in the HTML attributes of the emitted `<img>` when that option is used with an image that is not remote.
