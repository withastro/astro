---
'@astrojs/vercel': minor
---

Updates the Vercel adapter to support `assetQueryParams` and `internalFetchHeaders` configuration options for skew protection. When skew protection is enabled, the adapter now:

- Includes the deployment ID in asset URLs via `assetQueryParams` (query parameter: `dpl`)
- Includes the deployment ID in internal fetch requests via `internalFetchHeaders` (header: `x-vercel-deployment-id`)

This ensures that client and server versions match during deployments by tracking the deployment ID across both asset requests and internal API calls.
