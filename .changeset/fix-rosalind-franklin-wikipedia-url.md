---
'@astrojs/cloudflare': patch
'astro': patch
'@test/astro-cloudflare': patch
'@test/astro-cloudflare-vite-plugin': patch
'@test/content-layer': patch
---

Fixes a malformed Wikipedia URL for the Rosalind Franklin (rover) article in three fixture files. The closing parenthesis was outside the link, so the browser fetched `Rosalind_Franklin_(rover` (no close paren), which Wikipedia returns 404 for. Percent-encodes the parentheses so the link parses correctly.