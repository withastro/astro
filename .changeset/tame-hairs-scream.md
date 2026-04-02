---
'astro': patch
---

Updates `astro add cloudflare` to alway use the todays day as `compatibility_date` in the wrangler config, adapting to deprecation due to [upstream changes](https://github.com/cloudflare/workers-sdk/pull/13051)

Previously, when generating a compatibility date for new projects, the date was resolved by loading the locally packages. This approach was unreliable in some package manager environments. The logic now simply uses today's date instead, which is always correct and works reliably across all environments, this should always reliably work since now workerd supports dates up to 7 days in the future.