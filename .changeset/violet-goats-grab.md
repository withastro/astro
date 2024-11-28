---
'astro': minor
---

Updates `astro/config` import to reference `astro/client` types

When importing `astro/config`, types from `astro/client` will be made automatically available to your project. If your project `tsconfig.json` changes how references behave, you'll still have access to these types after running `astro sync`.
