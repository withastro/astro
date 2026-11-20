---
'@astrojs/node': patch
---

Fixes `staticHeaders` sending another page's `Content-Security-Policy` header to prerendered pages whose path is contained in another page's path (such as `/` or `/blog`), and sending no header for pages requested with a trailing slash
