---
'@astrojs/node': patch
---

Fixes `staticHeaders` sending the wrong `Content-Security-Policy` header for a prerendered page, or none at all. For example, `/` received the header of `/about`, `/blog` received the header of `/blog/post`, and `/about/` or a page with non-ASCII characters in its path, such as `/café`, received none
