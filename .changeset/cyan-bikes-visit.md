---
'astro': patch
---

Skips URL normalization writes that would not change the request path

Normalizing a request path decodes it and collapses duplicate slashes, then writes the result back to `url.pathname`. An ordinary path like `/about` is already decoded and has no duplicate slashes, so both writes assigned the value the URL already had. Writing `url.pathname` re-parses and re-serializes the whole URL, which costs more than parsing one from scratch, so those no-op writes were the most expensive part of normalizing a plain path. They are now skipped. This runs on every SSR request and on every rewrite, and behavior is unchanged.
