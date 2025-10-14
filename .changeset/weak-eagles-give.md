---
'@astrojs/node': minor
'astro': patch
---

Updates redirect handling to be consistent across `static` and `server` output, aligning with the behavior of other adapters.

Previously, the Node.js adapter used default HTML files with meta refresh tags when in `static` output. This often resulted in an extra flash of the page on redirect, while also not applying the proper status code for redirections. It's also likely less friendly to search engines.

This update ensures that configured redirects are always handled as HTTP redirects regardless of output mode, and the default HTML files for the redirects are no longer generated in `static` output. It makes the Node.js adapter more consistent with the other official adapters.

No change to your project is required to take advantage of this new adapter functionality. It is not expected to cause any breaking changes. However, if you relied on the previous redirecting behavior, you may need to handle your redirects differently now. Otherwise you should notice smoother redirects, with more accurate HTTP status codes, and may potentially see some SEO gains.
