---
'astro': patch
---

Fix X-Forwarded-Proto validation when allowedDomains includes both protocol and hostname fields. The protocol check no longer fails due to hostname mismatch against the hardcoded test URL.
