---
"@astrojs/cloudflare": patch
---

Fixes the Cloudflare adapter adding a `SESSION` KV binding even when sessions are explicitly configured to use a different driver, such as `unstorage/drivers/null`.
