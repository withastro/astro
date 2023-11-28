---
'astro': major
---

This change only affects maintainers of third-party adapters. In the Integration API, the `app.render()` method of the `App` class has been simplified. 

Instead of two optional arguments, it now takes a single optional argument that is an object with two optional properties: `routeData` and `locals`.
```diff
 app.render(request)

- app.render(request, routeData)
+ app.render(request, { routeData })

- app.render(request, routeData, locals)
+ app.render(request, { routeData, locals })

- app.render(request, undefined, locals)
+ app.render(request, { locals })
```
The current signature is deprecated but will continue to function until next major version.
