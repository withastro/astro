---
'astro': patch
---

Places the CSP `<meta>` tag at the start of `<head>` (after `<meta charset>` when it is the first element) in non-streaming renders so the policy covers inline scripts and other head content
