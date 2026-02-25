---
'@astrojs/node': major
---

Removes the `experimentalErrorPageHost` option

This option allowed to fetch the prerendered error page from a different host than the server it's currently running on.

However, we found it very hard to make it secure so we decided to remove it. You can replicate the old behavior by runninng with `mode: 'middleware'` and intercepting responses.
