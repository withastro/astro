---
'astro': patch
---

Fixes an issue where build output files could contain special characters (`!`, `~`, `{`, `}`) in their names, causing deploy failures on platforms like Netlify.
