---
'astro': patch
---

Fixed a regression where `.html` was unexpectedly stripped from dynamic route parameters on non-page routes (`.ts` endpoints and redirects). This caused endpoints like `/some/[...id].ts` returning `id: 'file.html'` on `getStaticPaths` to not serve that file because the generated route (`/some/file.html`) would get matched as `id: file` that is not part of the list returned by `getStaticPaths`.
