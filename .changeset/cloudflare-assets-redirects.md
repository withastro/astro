---
'@astrojs/cloudflare': patch
---

Fixes `_redirects` rules not applying when using `run_worker_first`. Redirects to another host with the same path (e.g. `/login https://app.example.com/login`) no longer fail with "Too many redirects", and redirects to another page no longer serve that page's content at the old URL.
