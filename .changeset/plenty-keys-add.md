---
'@astrojs/vercel': major
---

Remove the Vercel Edge adapter

With the Vercel adapter now supporting Edge middleware, there's no longer a need for an adapter for Edge itself (deploying your entire app to the edge). This adapter had several known limitations and compatibility issues that prevented very many people from using it in production. To reduce maintenance costs and because we have a better story with Serveless + Edge Middleware, we are removing the Edge adapter.
