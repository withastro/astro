---
'@astrojs/netlify': minor
---

Enables Netlify's skew protection feature for Astro sites deployed on Netlify. Skew protection ensures that your site's client and server versions stay synchronized during deployments, preventing issues where users might load assets from a newer deployment while the server is still running the older version.

When you deploy to Netlify, the deployment ID is now automatically included in both asset requests and API calls, allowing Netlify to serve the correct version to every user.
