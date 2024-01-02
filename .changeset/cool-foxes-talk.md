---
"astro": minor
---

Adds new helper functions for integration developers.

- Symbols used to represent `Astro.locals` and `Astro.clientAddress` are now available as static properties on the `App` class: `App.Symbol.locals` and `App.Symbol.clientAddress`.

- `Astro.clientAddress` can now be passed directly to the `app.render()` method.
```ts
const response = await app.render(request, { clientAddress: "012.123.23.3" })
```

- Helper functions for converting node http request and response objects to web-compatible `Request` and `Response` objects are now provided as static methods on the `NodeApp` class.
```ts
http.createServer((nodeReq, nodeRes) => {
    const request: Request = NodeApp.createRequest(nodeReq)
    const response = await app.render(request)
    NodeApp.writeResponse(response, nodeRes)
})
```

- Cookies added via `Astro.cookies.set()` can now be automatically added to the `Response` object by passing the `addCookieHeader` option to `app.render()`.
```diff
-const response = await app.render(request)
-const setCookieHeaders: Array<string> = Array.from(app.setCookieHeaders(webResponse));

-if (setCookieHeaders.length) {
-    for (const setCookieHeader of setCookieHeaders) {
-        headers.append('set-cookie', setCookieHeader);
-    }
-}
+const response = await app.render(request, { addCookieHeader: true })
```
