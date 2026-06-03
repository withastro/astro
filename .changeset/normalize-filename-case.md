---
'astro': patch
---

Fixes styles being stripped when the project root is started with a path whose case differs from the actual filesystem case (e.g. running `astro dev` from `d:\dev\app` while the folder on disk is `D:\dev\app`).
