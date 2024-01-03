---
'astro': minor
---

Cookie encoding / decoding can now be customized

Adds new `encode` and `decode` functions to allow customizing how cookies are encoded and decoded. For example, you can bypass the default encoding via `encodeURIComponent` when adding a URL as part of a cookie:

```astro
---
Astro.cookies.set('url', Astro.url.toString(), {
  // Override the default encoding so that URI components are not encoded
  encode: o => o
});
---
```

Later, you can get back the URL in the same way:

```astro
---
const url = Astro.cookies.get('url', {
  decode: o => o
});
---
```
