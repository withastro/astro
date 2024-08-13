---
'astro': patch
---

Fixes a case where omitting a semicolon and line ending with carriage return - CRLF - in the `prerender` option could throw an error.
