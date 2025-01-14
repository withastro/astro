---
'astro': patch
---

Fixes an issue where server islands do not work in projects that use a server adapter but only have prerendered pages. If a server adapter is added, the server island endpoint will now be added by default.
