---
'astro': patch
---

Uses today’s date for Cloudflare `compatibility_date` in `astro add cloudflare`

When creating new projects, `astro add cloudflare` now sets `compatibility_date` to the current date. Previously, this date was resolved from locally installed packages, which could be unreliable in some package manager environments. Using today’s date is simpler and more reliable across environments, and is supported by [`workerd`](https://github.com/cloudflare/workers-sdk/pull/13051).

Previously, when generating a compatibility date for new projects, the date was resolved by loading the locally packages. This approach was unreliable in some package manager environments. The logic now simply uses today's date instead, which is always correct and works reliably across all environments, this should always reliably work since now workerd supports dates up to 7 days in the future.