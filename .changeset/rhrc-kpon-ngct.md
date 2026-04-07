---
'astro': patch
---

Fixes sync content inside `<Fragment>` not streaming to the browser until all async sibling expressions have resolved.
