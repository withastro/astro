---
'astro': patch
---

Places the CSP `<meta>` tag at the start of `<head>` (immediately after `<meta charset>`) in non-streaming renders so the policy covers inline scripts and head content
