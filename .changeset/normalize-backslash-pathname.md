---
'astro': patch
---

Hardens URL pathname normalization to consistently handle backslash characters after decoding, ensuring middleware and router see the same canonical pathname
