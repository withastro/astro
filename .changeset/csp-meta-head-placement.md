---
'astro': patch
'@astrojs/runtime': patch
---

Places the CSP `<meta>` tag at the start of `<head>` (immediately after `<meta charset>`) in non-streaming renders so the policy covers inline scripts and head content.

Inline `<head>` scripts that were previously placed before the policy, and so were not covered by it, are now checked against it. If such a script isn't allowed by your CSP configuration (for example with a hash in `security.csp.scriptDirective.hashes`), it will now be blocked.
