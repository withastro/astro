---
"astro": patch
---

Fix inconsistency between route priorities of file routes, redirects and injected routes


Now all groups are prioritized following the same rules:

- Routes with more path segments will take precedence over less specific routes. E.g. `/blog/post/[pid].astro` takes precedence over `/blog/[...slug].astro`.
- Static routes without path parameters will take precedence over dynamic routes. E.g. `/posts/create.astro` takes precedence over all the other routes in the example.
- Dynamic routes using named parameters take precedence over rest parameters. E.g. `/posts/[page].astro` takes precedence over `/posts/[...slug].astro`.
- Pre-rendered dynamic routes take precedence over server dynamic routes.
- Endpoints take precedence over pages. E.g. `/posts/[pid].ts` takes precedence over `/posts/[pid].astro`.
- If none of the rules above decide the order, routes are sorted alphabetically based on the default locale of your Node installation.
