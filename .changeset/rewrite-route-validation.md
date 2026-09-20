---
'astro': patch
---

Fixes an internal rewrite selecting the wrong route when two dynamic routes match the same path

`Astro.rewrite()`, `context.rewrite()` and i18n fallback rewrites resolve their target through
`findRouteToRewrite`, which committed to the first route whose pattern matched the requested path.
Its only way to reject a route that matches the pattern without producing the path reads
`route.distURL`, which is populated only while a build writes files. In `astro dev`, and for
on-demand routes in a server build, that check could never run.

As a result, a rewrite to a path owned by a later dynamic route failed whenever an earlier dynamic
route also matched the pattern. Given `src/pages/[category]/index.astro` returning no paths alongside
`src/pages/[...slug].astro`, `GET /alpha/` rendered normally but
`context.rewrite('/alpha/')` threw ``A `getStaticPaths()` route pattern was matched, but
no matching static path was found``, because `/[category]` was selected and owns nothing.

Candidates are now validated when `distURL` is unavailable, the same way `matchRoute` already
validates them for an ordinary request: ask whether the route's `getStaticPaths()` produces this
path, and move on to the next candidate when it does not.

Error handling follows `matchRoute` too. A candidate whose `getStaticPaths()` throws is skipped
rather than allowed to hide the route that owns the path, and that error is rethrown only when no
candidate owned it, so a genuine failure never degrades into a silent 404. The `distURL` fast path
is untouched, so builds are unchanged, and a caller that passes no validator keeps the previous
first-match behaviour.
