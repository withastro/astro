---
'astro': patch
---

Enhances the dev server logging when rewrites occur during the lifecycle or rendering.

The dev server will log the status code **before** and **after** a rewrite:

```shell
08:16:48 [404 → rewrite → 200] /foo/about 200ms
08:22:13 [200 → rewrite → 404] /about 23ms
```
