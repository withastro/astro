---
'@astrojs/netlify': minor
---

Adds support for `assetQueryParams` and `internalFetchHeaders` in the Netlify adapter. When deployed to Netlify, the adapter now:

- Includes the deployment ID in asset URLs via `assetQueryParams` (query parameter: `dpl`)
- Includes the deployment ID in internal fetch requests via `internalFetchHeaders` (header: `X-Netlify-Deploy-ID`)

This enables Netlify's skew protection feature, which ensures that client and server versions match during deployments by tracking the deployment ID across both asset requests and internal API calls.
