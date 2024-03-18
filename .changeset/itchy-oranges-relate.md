---
"@astrojs/vercel": minor
---

The special-case handling of `src/vercel-edge-middleware.js` file is now deprecated. This file allowed you to access the edge runtime's `RequestContext` object, and create the middleware `locals` from its fields. However, this object includes only one field - the `waitUntil()` function - which is now available directly as `ctx.locals.waitUntil()`.
