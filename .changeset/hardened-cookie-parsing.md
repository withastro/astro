---
'astro': patch
---

Hardens internal cookie parsing to use a null-prototype object consistently for the fallback path, aligning with how the cookie library handles parsed values
