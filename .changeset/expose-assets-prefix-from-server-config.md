---
'astro': patch
---

Exposes `build.assetsPrefix` from the `astro:config/server` virtual module. Previously the property was missing, even though the deprecation notice on `import.meta.env.ASSETS_PREFIX` directed users to read it from `build.assetsPrefix` on `astro:config/server`.