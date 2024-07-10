---
'astro': patch
---

Limits the number of pages logged by default to 100 per route.

If there are more than 100 pages it will log the first 100 pages and then log a summary of the total number of pages.

For example:

```sh
10:08:26   ├─ /blog/article-98/index.html (+0ms)
10:08:26   ├─ /blog/article-99/index.html (+1ms)
10:08:26   └─ ...rendering 100 more paths. Done. (+63ms)
```

To see the full list of pages rendered, enable debug logging using the `--verbose` flag.
