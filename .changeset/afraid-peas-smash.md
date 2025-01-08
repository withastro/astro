---
'astro': patch
---

Fixes a bug where Astro attempted to decode a request URL multiple times, resulting in an unexpected behaviour when decoding the character `%`
