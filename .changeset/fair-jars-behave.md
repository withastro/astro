---
"astro": minor
---

Adds a new experimental security option to prevent [Cross-Site Request Forgery (CSRF) attacks](https://owasp.org/www-community/attacks/csrf). This feature is available only for pages rendered on demand:

```js
import { defineConfig } from "astro/config"
export default defineConfig({
  experimental: {
    security: {
      csrfProtection: {
        origin: true
      }
    }
  }
})
```

Enabling this setting performs a check that the "origin" header, automatically passed by all modern browsers, matches the URL sent by each `Request`.

This experimental "origin" check is executed only for pages rendered on demand, and only for the requests `POST, `PATCH`, `DELETE` and `PUT` with one of the following `content-type` headers: 'application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'.

It the "origin" header doesn't match the pathname of the request, Astro will return a 403 status code and won't render the page.
