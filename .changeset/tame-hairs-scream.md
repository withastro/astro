---
'astro': patch
---

Uses today’s date for Cloudflare `compatibility_date` in `astro add cloudflare`

When creating new projects, `astro add cloudflare` now sets `compatibility_date` to the current date. Previously, this date was resolved from locally installed packages, which could be unreliable in some package manager environments. Using today’s date is simpler and more reliable across environments, and is supported by [`workerd`](https://github.com/cloudflare/workers-sdk/pull/13051).
