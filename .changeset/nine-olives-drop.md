---
'astro': minor
---

Adds a new `partitioned` option when setting a cookie to allow creating partitioned cookies.

[Partitioned cookies](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Privacy_sandbox/Partitioned_cookies) can only be read within the context of the top-level site on which they were set. This allows cross-site tracking to be blocked, while still enabling legitimate uses of third-party cookies.

You can create a partitioned cookie by passing `partitioned: true` when setting a cookie. Note that partitioned cookies must also be set with `secure: true`:

```js
Astro.cookies.set('my-cookie', 'value', {
  partitioned: true,
  secure: true,
});
```

For more information, see the [`AstroCookieSetOptions` API reference](https://docs.astro.build/en/reference/api-reference/#astrocookiesetoptions).
