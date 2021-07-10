---
'astro': patch
---

Remove custom Astro.fetchContent() glob implementation, use `import.meta.globEager` internally instead.