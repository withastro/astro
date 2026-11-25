---
'create-astro': patch
---

Fixes `create astro` overwriting an `AGENTS.md` file shipped by the selected template. The default `AGENTS.md` is now only written when the template does not provide one.
