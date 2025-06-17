---
'astro': patch
---

Fixes an issue where `report-uri` wasn't available in `experimental.csp.directives`, causing a typing error and a runtime validation error.
