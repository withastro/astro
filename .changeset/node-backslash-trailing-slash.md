---
'@astrojs/internal-helpers': patch
'@astrojs/node': patch
---

Fixes trailing-slash handling for request paths that begin with a backslash

With `trailingSlash: 'always'`, the standalone Node server could append a trailing slash to a request path that begins with a backslash (for example `/\example.com/foo`) and echo that path back in the `Location` header of a `301` response. Because browsers resolve a leading `\` the same way as `/`, the resulting `Location` could point off-site.

Such paths are now recognized as internal paths, matching the existing handling for paths that begin with `//`, so they are no longer rewritten with a trailing slash.
