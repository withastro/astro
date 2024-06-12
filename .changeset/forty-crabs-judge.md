---
'astro': patch
---

Adds an optional middleware for usage with `astro:env`

If you're using `astro:env`, you can now use a middleware to detect server envrionment variables leaks on the client:

```ts
import { leakDetectionMiddleware } from 'astro/env/middleware'

export const onRequest = leakDetectionMiddleware()
```

An error will be thrown instead of rendering the page if a leak is detected.

You can pass 2 options:

1. `filterContentType`: filters what response content type should trigger the check. Defaults to the content type starting with `/text` or `application/json` 
2. `excludeKeys`: by default, all server environment variables are checked. However, you may have variables whose value is really likely to end up on the client but not because it leaked (eg. `test`). In this case, you can exclude those keys.

```ts
import { leakDetectionMiddleware } from 'astro/env/middleware'

export const onRequest = leakDetectionMiddleware({
    // Do not filter json response
    filterContentType: (contentType) => contentType.startsWith('text/'),
    excludeKeys: ['PORT']
})
```