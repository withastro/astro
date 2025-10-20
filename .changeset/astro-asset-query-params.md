---
'astro': minor
---

Adds two new adapter configuration options `assetQueryParams` and `internalFetchHeaders` to the Adapter API.

Adapters can now use `client.assetQueryParams` to specify query parameters that should be appended to asset URLs (CSS, JavaScript, images, fonts, etc.). The query parameters are automatically appended to all generated asset URLs during the build process.

Adapters can also use `client.internalFetchHeaders` to specify headers that should be included in Astro's internal fetch calls (Actions, View Transitions, Server Islands, Prefetch).

This enables features like Netlify's skew protection, which requires the deploy ID to be sent with both internal requests and asset URLs to ensure client and server versions match during deployments.
