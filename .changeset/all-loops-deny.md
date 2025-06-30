---
'astro': minor
---

If you're an adapter developer, and use the `NodeApp` for your adapter, the function  `NodeApp.match` method to accept a second, optional parameter.

When you use `NodeApp.match(request)`, Astro checks if there's a route that matches the given `Request`. If there is and it's prerendered, the function returns `undefined`, because static routes (prerendered) are already rendered.

When you use `NodeApp.match(request, true)`, Astro will return the first matched route, even when it's a prerendered route.
