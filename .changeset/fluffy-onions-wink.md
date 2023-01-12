---
'astro': patch
---

Better handle content type generation failures:
- Generate types when content directory is empty
- Log helpful error when running `astro sync` without a content directory
- Avoid swallowing `config.ts` syntax errors from Vite
