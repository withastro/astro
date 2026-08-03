---
'@astrojs/vercel': patch
---

Prevents `astro build` from crashing with `EEXIST` when `.vercel/output/server/` already exists by creating it with `{ recursive: true }`, matching the sibling `static/` directory call
