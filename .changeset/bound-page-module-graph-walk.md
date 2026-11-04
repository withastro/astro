---
'astro': patch
---

Avoids attributing client-only components or scripts to unrelated pages importing `astro:i18n` by bounding top-level page graph traversal at virtual page entries
