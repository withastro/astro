---
'@astrojs/vercel': minor
---

Support for Vercel Edge Middleware via Astro middleware.

When a project uses the new option Astro `build.excludeMiddleware`, the 
`@astrojs/vercel/serverless` adapter will automatically create a Vercel Edge Middleware
that will automatically communicate with the Astro Middleware.

Check the [documentation](https://github.com/withastro/astro/blob/main/packages/integrations/vercel/README.md##vercel-edge-middleware-with-astro-middleware) for more details.
