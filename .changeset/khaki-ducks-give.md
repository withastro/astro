---
'astro': patch
---

Fixes edge case on view transitions not working for some valid responses

If a page was returned by the server with blank spaces before the `;` separator in the `Content-Type` header,
the view transition would not work and a full page reload would occur.
Now such scenarios will have the correct view transition.
