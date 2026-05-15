---
'@astrojs/cloudflare': patch
---

Fixes a bug where the Cloudflare adapter silently produced 0-byte files when a page threw during prerendering. The build now fails with a clear error message instead of reporting success with corrupt output.

This could happen when page code used Node.js APIs (like `node:crypto`) that are unavailable in the workerd runtime without the `nodejs_compat` compatibility flag. Previously, the error was converted to an HTTP 500 response by workerd, but the adapter's `render()` method did not check the response status — unlike the sibling `getStaticPaths()` and `collectStaticImages()` methods which already had this check.
