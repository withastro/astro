---
'astro': minor
---

Adds new middleware modes "always" and "on-request", and exposes `Astro.buildPhase` / `ctx.buildPhase`.

This value allows you to control when Astro's middleware is applied. Before, middleware would run on request for dynamic pages, and during build for static pages. You can now choose from the following modes by setting the `middlewareMode` in your adapter settings.

| Mode | Build-time (prerendered pages) | Request-time (SSR pages) | Request-time (prerendered pages) | Use case |
|------|:---:|:---:|:---:|---------|
| `"classic"` (default) | ✅ | ✅ | ❌ | Today's default. Middleware affects static pages only at build time. |
| `"always"` | ✅ | ✅ | ✅ | Middleware runs everywhere. Good for auth, A/B testing, personalization on all pages. |
| `"on-request"` | ❌ | ✅ | ✅ | Middleware only runs at request time. For runtime-only concerns (auth headers, sessions). |
| `"edge"` | ❌ | ❌ (separate bundle) | ❌ (separate bundle) | Middleware deployed as a separate edge function (Vercel, Netlify). Formerly known as `edgeMiddleware` config option. |

When middleware runs, you can inspect `buildPhase` to determine whether Astro is executing it during `astro build` (`"build"`) or while handling a live request (`"request"`).