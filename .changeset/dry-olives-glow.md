---
'astro': patch
---

Adds shared helper utilities for CDN cache provider authors

Exports `astro/cache/provider-utils` with helpers for building platform-specific cache-control headers, generating path-based invalidation tags, and normalizing invalidation options. These are used internally by the first-party Netlify, Vercel, and Cloudflare cache providers.
