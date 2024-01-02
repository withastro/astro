---
'astro': minor
---

Cookie encoding / decoding can now be customized

New `encode` and `decode` functions allow customizing how cookies are encoded and decoded. For example, cookies are by default encoded via `encodeURIComponent`, but you might want to avoid that in some cases such as when adding a URL as part of a cookie.

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
