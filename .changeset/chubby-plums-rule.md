---
'@astrojs/internal-helpers': minor
---

Added a new entry point called `/request`, which exposes utilities to work with the `Request` type: 
- `getClientIpAddress`: retrieves the value of the `x-forwarded-for` header.
- `getFirstForwardedValue`: retrieves the first value of a header.
