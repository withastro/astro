---
"astro": minor
---

Adds a new security - and experimental - option to prevent CSRF attacks. This feature is available only for on-demand pages:

```js
import { defineConfig } from "astro/config"
export default defineConfig({
  security: {
    csrfProtection: {
      origin: true
    }
  },
  experimental: {
    csrfProtection: true
  }
})
```

When enabled, it checks that the "origin" header, automatically passed by all modern browsers, matches the URL sent by each `Request`.

The "origin" check is executed only on-demand pages, and only for the requests `POST, `PATCH`, `DELETE` and `PUT`, only for those requests that
the followin `content-type` header: 'application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'.

It the "origin" header doesn't match the pathname of the request, Astro will return a 403 status code and won't render the page.
