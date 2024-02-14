---
"astro": patch
---

Fixes regression on routing priority for multi-layer index pages

The sorting algorithm positions more specific routes before less specific routes, and considers index pages to be more specific than a dynamic route with a rest parameter inside of it.
This means that `/blog` is considered more specific than `/blog/[...slug]`.

But this special case was being applied incorrectly to indexes, which could cause a problem in scenarios like the following:
- `/`
- `/blog`
- `/blog/[...slug]`

The algorithm would make the following comparisons:
- `/` is more specific than `/blog` (incorrect)
- `/blog/[...slug]` is more specific than `/` (correct)
- `/blog` is more specific than `/blog/[...slug]` (correct)

Although the incorrect first comparison is not a problem by itself, it could cause the algorithm to make the wrong decision.
Depending on the other routes in the project, the sorting could perform just the last two comparisons and by transitivity infer the inverse of the third (`/blog/[...slug` > `/` > `/blog`), which is incorrect.

Now the algorithm doesn't have a special case for index pages and instead does the comparison soleley for rest parameter segments and their immediate parents, which is consistent with the transitivity property.
