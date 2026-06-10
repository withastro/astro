---
'@astrojs/internal-helpers': patch
---

Fixes `joinPaths()` mishandling the last path segment when an earlier argument is a non-string (e.g. `undefined`)

`joinPaths()` filters out non-string arguments, but the check that identifies the last segment compared the index against the original (unfiltered) argument count. When a skipped argument preceded the final one, the real last segment was treated as a middle segment and had its trailing slash stripped. As a result, `joinPaths('/base', undefined, 'docs/setup/')` returned `/base/docs/setup` instead of `/base/docs/setup/`. The last-segment check now uses the filtered segment count, so a skipped argument no longer changes the result of the remaining segments.
