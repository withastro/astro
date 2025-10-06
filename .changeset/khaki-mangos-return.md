---
'astro': minor
---

Hyphenate string font weights in the dev font URL hash resolver so variable-weight ranges stop producing whitespace in hashed filenames, which was triggering 404s from the dev font proxy.
