---
'@astrojs/node': patch
---

Fixes `staticHeaders` sending another page's `Content-Security-Policy` header for a prerendered page, for example the home page receiving the header of `/about`, or `/blog` receiving the header of `/blog/post`
