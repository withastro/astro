---
'astro': patch
---

Use GET requests with preloading for Server Islands

Server Island requests include the props used to render the island as well as any slots passed in (excluding the fallback slot). Since browsers have a max 4mb URL length we default to using a POST request to avoid overflowing this length.

However in reality most usage of Server Islands are fairly isolated and won't exceed this limit, so a GET request is possible by passing this same information via search parameters.

Using GET means we can also include a `<link rel="preload">` tag to speed up the request.

This change implements this, with safe fallback to POST.
