---
"@astrojs/vercel": minor
---

Implements verification for edge middleware. This is a security measure to ensure that your serverless functions are only ever called by your edge middleware and not a third party.

When `edgeMiddleware` is enabled, the serverless function will now respond with `403 Forbidden` for requests that are not verified to have come from the generated edge middleware. No user action is necessary.
