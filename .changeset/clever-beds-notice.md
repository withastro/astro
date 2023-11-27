---
'astro': major
---

Removes support for returning simple objects from endpoints (deprecated since Astro 3.0). You should return a `Response` instead.

`ResponseWithEncoding` is also removed. You can refactor the code to return a response with an array buffer instead, which is encoding agnostic.

The types for middlewares have also been revised. To type a middleware function, you should now use `MiddlewareHandler` instead of `MiddlewareResponseHandler`. If you used `defineMiddleware()` to type the function, no changes are needed.
