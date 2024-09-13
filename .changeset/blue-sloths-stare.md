---
'astro': patch
---

`render()` signature now takes `renderOptions` as 2nd argument

The signature for `app.render()` has changed, and the second argument is now an options object called `renderOptions` with more options for customizing rendering.

The `renderOptions` are:

- `addCookieHeader`: Determines whether Astro will set the `Set-Cookie` header, otherwise the adapter is expected to do so itself.
- `clientAddress`: The client IP address used to set `Astro.clientAddress`.
- `locals`: An object of locals that's set to `Astro.locals`.
- `routeData`: An object specifying the route to use.
