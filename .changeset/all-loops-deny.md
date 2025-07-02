---
'astro': minor
---

Updates the `NodeApp.match()` function in the Adapter API to accept a second, optional parameter to allow adapter authors to add headers to static, prerendered pages.

`NodeApp.match(request)` currently checks whether there is a route that matches the given `Request`. If there is a prerendered route, the function returns `undefined`, because static routes are already rendered and their headers cannot be updated.

When the new, optional boolean parameter is passed (e.g. `NodeApp.match(request, true)`), Astro will return the first matched route, even when it's a prerendered route. This allows your adapter to now access static routes and provides the opportunity to set headers for these pages, for example, to implement a Content Security Policy (CSP).
