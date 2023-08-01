---
'astro': major
---

Astro.cookies.get(key) returns undefined if cookie doesn't exist

With this change, Astro.cookies.get(key) no longer always returns a `AstroCookie` object. Instead it now returns `undefined` if the cookie does not exist.

You should update your code if you assume that all calls to `get()` return a value. When using with `has()` you still need to assert the value, like so:

```astro
---
if(Astro.cookies.has(id)) {
  const id = Astro.cookies.get(id)!;
}
---
```
