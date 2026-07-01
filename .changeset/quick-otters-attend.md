---
'astro': patch
---

Hardens `renderHTMLElement` to drop attribute names containing characters that are invalid per the HTML spec (`"`, `'`, `>`, `/`, `=`, whitespace), matching the guard already applied in `addAttribute`
