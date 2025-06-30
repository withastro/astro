---
'astro': minor
---

Updates the `App.match` and `NodeApp.match` method to accept a second, optional parameter.

When you use `App.match(request)`, Astro checks if there's a route that matches the given `Request`. If there is and it's prerendered, the function returns `undefined`, because static routes (prerendered) are already rendered.

When you use `App.match(request, true)`, Astro will return the first matched route, even when it's a prerendered route.
