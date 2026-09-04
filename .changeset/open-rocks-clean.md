---
'astro': patch
---

Fixes prototype pollution in config merge by filtering `__proto__`, `constructor`, and `prototype` keys
