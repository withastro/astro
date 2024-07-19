---
'astro': patch
---

Enhances the dev server logging when rewrites occur during the lifecycle or rendering.

The dev server will log the status code **before** and **after** a rewrite:

```shell
08:16:48 [404] (rewrite) /foo/about 200ms
08:22:13 [200] (rewrite) /about 23ms
```
