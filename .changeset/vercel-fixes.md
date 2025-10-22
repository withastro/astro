---
'@astrojs/vercel': minor
---

Enables skew protection for Astro sites deployed on Vercel. Skew protection ensures that your site's client and server versions stay synchronized during deployments, preventing issues where users might load assets from a newer deployment while the server is still running the older version.

Skew protection is automatically enabled on Vercel deployments when the `VERCEL_SKEW_PROTECTION_ENABLED` environment variable is set to `1`. The deployment ID is automatically included in both asset requests and API calls, allowing Vercel to serve the correct version to every user.
