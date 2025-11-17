---
"astro": patch
"@astrojs/internal-helpers": patch
---

Fixes wildcard hostname pattern matching to correctly reject hostnames without dots

Previously, hostnames like `localhost` or other single-part names would incorrectly match patterns like `*.example.com`. The wildcard matching logic has been corrected to ensure that only valid subdomains matching the pattern are accepted.
