---
'astro': major
---

Prevent usage of `astro:content` in the client

Usage of `astro:content` in the client has always been discouraged because it leads to all of your content winding up in your client bundle, and can possibly leaks secrets.

This formally makes doing so impossible, adding to the previous warning with errors.

In the future Astro might add APIs for client-usage based on needs.
