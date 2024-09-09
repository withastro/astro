---
'astro': minor
---

Unflag Server Islands

[Server Islands](https://astro.build/blog/future-of-astro-server-islands/), Astro's solution for highly cacheable pages of mixed static and dynamic content, is now unflagged and is available to all.

To use a server island, simply add `server:defer` to any Astro component. It will be rendered dynamically at runtime outside the context of the rest of the page, allowing you to add longer cache headers for the pages, or even prerender them.

If you are using Server Islands today, simply remove the `expermental.serverIslands` option from your Astro config.
