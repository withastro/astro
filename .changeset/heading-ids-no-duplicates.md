---
'@astrojs/markdown-satteri': patch
---

Fixes headings being listed twice in a page's `headings` metadata when an integration (such as Starlight) assigns heading IDs with its own heading pass before adding anchor links
