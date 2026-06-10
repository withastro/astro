---
'astro': patch
---

Hardens `addAttribute` to drop attribute names containing characters that are invalid per the HTML spec (`"`, `'`, `>`, `/`, `=`, whitespace)
