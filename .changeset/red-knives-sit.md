---
'astro': patch
---

Fixes importing npm packages within CSS

This change fixes a longstanding bug where the string `VITE_ASSET` was left in CSS when trying to import CSS packages. The fix comes thanks to an upstream Vite feature that allows us to hand off most of the CSS bundling work to Vite.
