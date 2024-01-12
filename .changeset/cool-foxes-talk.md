---
"astro": minor
---

Adds new helper functions for adapter developers.

- `Astro.clientAddress` can now be passed directly to the `app.render()` method.
```ts
const response = await app.render(request, { clientAddress: "012.123.23.3" })
```

- Helper functions for converting Node.js HTTP request and response objects to web-compatible `Request` and `Response` objects are now provided as static methods on the `NodeApp` class.
```ts
http.createServer((nodeReq, nodeRes) => {
    const request: Request = NodeApp.createRequest(nodeReq)
    const response = await app.render(request)
    await NodeApp.writeResponse(response, nodeRes)
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
