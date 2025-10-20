---
'@astrojs/netlify': minor
---

Enables Netlify's skew protection feature for Astro sites deployed on Netlify. Skew protection ensures that your site's client and server versions stay synchronized during deployments, preventing issues where users might load assets from a newer deployment while the server is still running the older version.

When you deploy to Netlify, the deployment ID is now automatically included in both asset requests and API calls, allowing Netlify to serve the correct version to every user. These are set for built-in features (Actions, View Transitions, Server Islands, Prefetch). If you are making your own fetch requests to your site, you can include the header manually using the `DEPLOY_ID` environment variable:

```js
const response = await fetch('/api/endpoint', {
  headers: {
    'X-Netlify-Deploy-ID': import.meta.env.DEPLOY_ID,
  },
});
```
