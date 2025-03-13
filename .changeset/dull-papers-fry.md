---
'astro': patch
---

Reuses experimental session storage object between requests. This prevents memory leaks and improves performance for drivers that open persistent connections to a database. 

