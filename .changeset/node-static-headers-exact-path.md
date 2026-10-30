---
'@astrojs/node': patch
---

Fixes `staticHeaders` sending a prerendered page the headers of another page, or none at all. The home page received the Content-Security-Policy of whichever page was listed first, and a page requested with a trailing slash, such as `/about/`, received no Content-Security-Policy.
