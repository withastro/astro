---
'astro': patch
---

Fix styles missing when the working directory path case differs from the filesystem on case-insensitive systems (e.g. Windows)

When running `astro dev` from a directory with different casing than the actual filesystem path (e.g. `d:\dev` vs `D:\dev`), styles would not be applied because Astro treated the differently-cased paths as different files. The root path is now normalized using `fs.realpathSync` to ensure consistent casing.
