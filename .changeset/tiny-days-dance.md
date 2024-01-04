---
'astro': minor
---

Cookie encoding / decoding can now be customized

Adds new `encode` and `decode` functions to allow customizing how cookies are encoded and decoded. For example, you can bypass the default encoding via `encodeURIComponent` when adding a URL as part of a cookie:

```astro
---
import { encodeCookieValue } from "./cookies";
Astro.cookies.set('url', Astro.url.toString(), {
  // Override the default encoding so that URI components are not encoded
  encode: value => encodeCookieValue(value)
});
---
```

Later, you can decode the URL in the same way:

```astro
---
import { decodeCookieValue } from "./cookies";
const url = Astro.cookies.get('url', {
  decode: value => decodeCookieValue(value)
});
---
```
