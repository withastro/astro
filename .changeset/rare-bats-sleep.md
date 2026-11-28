---
'@astrojs/vite-plugin-astro': patch
'astro': patch
---

Fixes scoped styles not applying when the project is started from a path whose case differs from the folder on disk (e.g. `D:\TMP\my-site` while the folder is `D:\tmp\my-site`), and makes scope hashes independent of that casing in builds
