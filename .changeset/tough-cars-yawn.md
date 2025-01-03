---
'astro': patch
---

Fixes a bug where session data could be corrupted if it is changed after calling .set(); also fixes a bug where responses can be returned before session data is saved
