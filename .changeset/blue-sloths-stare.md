---
'astro': patch
---

App class now accepts renderOptions

The signature for `app.render()` has changed, and the second argument is now an options object called `renderOptions`. This allows you greater customization of rendering than with the old signature.

The renderOptions are:

- `addCookieHeader`: Determines whether Astro will set the `Set-Cookie` header, otherwise the adapter is expected to do so itself.
- `clientAddress`: The client IP address used to set `Astro.clientAddress`.
- `locals`: An object of locals that's set to `Astro.locals`.
- `routeData`: An object specifying the route to use.
