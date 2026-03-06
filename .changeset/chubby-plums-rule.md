---
'@astrojs/internal-helpers': minor
---

Added a new entry point called `/request`, which exposes utilities to work with the `Request` type: 
- `getFirstForwardedValue`: retrieves the first value of a multi-value header.
- `isValidIpAddress`: checks whether a string contains only characters valid in IPv4/IPv6 addresses.
- `getValidatedIpFromHeader`: extracts the first value from a header and validates it as an IP address.
- `getClientIpAddress`: retrieves and validates the first IP from the `x-forwarded-for` header.
