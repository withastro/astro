---
'astro': patch
---

Fixes a crash when rendering pages with invalid module structure

This change adds defensive validation to check that `mod.page` is a function before calling it in `App.render()` and `#renderError()`. Previously, if a route's module didn't have a valid `page` function (which can occur when using static output mode with an SSR adapter, or during stress testing with URLs containing hash fragments), the server would crash with `TypeError: mod.page is not a function`.

Now, the server will:
1. Throw a descriptive `AstroError` with a helpful message explaining the issue
2. Gracefully handle error pages that have invalid module structure by returning a basic error response

Fixes #14625
