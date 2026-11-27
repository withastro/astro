---
'@astrojs/runtime': patch
---

Makes `renderToString()` faster and lighter on first use. It now renders a page straight to a string instead of building a `Response`, encoding the page to UTF-8 and decoding it again, and it no longer reads the global `Response`, `Request` or `Headers` unless a component asks for `Astro.request`, `Astro.url` or the response headers (reading them for the first time loads undici, which costs tens of milliseconds per thread). The returned string is unchanged, including lone surrogates becoming U+FFFD and a leading BOM being dropped.
