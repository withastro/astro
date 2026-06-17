---
'astro': patch
---

Fixes the custom `500.astro` page receiving an empty `error` prop when the error originated in middleware. While rendering the error page the error handler re-runs middleware; when that throws again it retries with middleware skipped, but the retry was dropping the original error, leaving `Astro.props.error` undefined. The error is now carried through, so the 500 page can show what failed on every path (the standard adapter and the `astro/hono` composable handlers alike).
