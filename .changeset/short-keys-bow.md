---
"astro": patch
---

Updates [Astro's routing priority rules](https://docs.astro.build/en/core-concepts/routing/#route-priority-order) to prioritize the most specifically-defined routes. 

Now, routes with **more defined path segments** will take precedence over less-specific routes.

For example, `/blog/posts/[pid].astro` (3 path segments) takes precedence over `/blog/[...slug].astro` (2 path segments). This means that:

- `/pages/blog/posts/[id].astro` will build routes of the form `/blog/posts/1` and `/blog/posts/a`
- `/pages/blog/[...slug].astro` will build routes of a variety of forms, including `blog/1` and `/blog/posts/1/a`, but will not build either of the previous routes.

For a complete list of Astro's routing priority rules, please see the [routing guide](https://docs.astro.build/en/core-concepts/routing/#route-priority-order).


