---
'astro': minor
'@astrojs/cloudflare': patch
'@astrojs/netlify': patch
'@astrojs/vercel': patch
---

Adds `getRequestURL()`, exported from `astro/app`, which returns the parsed `URL` of a request and parses `request.url` at most once per request

An adapter usually needs a request's URL before it hands the request to `app.match()` and `app.render()`, and until now each of those steps parsed the same string over again. `getRequestURL()` lets them all share one parse:

```js
import { getRequestURL } from 'astro/app';

const url = getRequestURL(request);
```

The returned `URL` is shared with everything else that asks for this request's URL, so treat it as read-only. Code that needs to rewrite a URL should build its own with `new URL(request.url)`.

Astro's own adapters now use it. On a request that reaches `app.match()`, the adapter's own lookup and the two parses inside `match()` become a single shared parse.
