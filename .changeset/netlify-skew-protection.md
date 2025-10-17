---
'astro': minor
'@astrojs/netlify': minor
---

Adds adapter support for injecting headers into Astro's internal fetch calls (Actions, View Transitions, Server Islands, Prefetch). Adapters can now use `client.internalFetchHeaders` to specify headers that should be included in these requests.

This enables features like Netlify's skew protection, which requires the deploy ID to be sent with internal requests to ensure client and server versions match during deployments.
