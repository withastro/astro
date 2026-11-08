---
'astro': patch
---

Fixes `<Font preload>` emitting no preload links when a requested weight range such as `"400 700"` sits inside a variable font file's range such as `"400 900"`
