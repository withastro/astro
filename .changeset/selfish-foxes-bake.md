---
'astro': minor
---

## Support passing a custom status code for Astro.redirect

New in this minor is the ability to pass a status code to `Astro.redirect`. By default it uses `302` but now you can pass another code as the second argument:

```astro
---
// This page was moved
return Astro.redirect('/posts/new-post-name', 301);
---
```
