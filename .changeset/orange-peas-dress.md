---
'astro': patch
---

Fixes a crash when a request arrives with a malformed port in the `Host` header (for example `example.com:65536` or `example.com:8080:8080`). Such a host made the constructed request URL invalid, and the fallback that was meant to recover reused the same invalid host and threw again. The request URL now degrades to a host the server controls when the incoming host cannot be parsed, so the request is handled instead of erroring.
