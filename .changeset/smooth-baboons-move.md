---
'astro': patch
---

Fixes a bug where inline styles and scripts didn't work when CSP was enabled. Now when adding `<styles>` elements inside an Astro component, their hashes care correctly computed.
