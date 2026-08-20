---
'astro': patch
---

Fixes an issue where Astro CSP support didn't correctly handle cases `"unsafe-inline"` resource. Now when `"unsafe-inline"`, Astro won't emit hashes for the directive specified.
