---
'astro': patch
---

Fixes `security.csp` placing the CSP `<meta>` element at the end of `<head>`, where it does not apply to scripts and styles that come before it. The element is now added right after `<meta charset>` (or at the start of `<head>`) in prerendered and non-streaming pages. Inline scripts and styles in `<head>` that are not allowed by the policy will now be blocked, as they are elsewhere on the page
