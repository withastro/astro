---
'astro': patch
---

Adds `Cache-Control: public, max-age=0, must-revalidate` to cached route responses that carry a validator (`Last-Modified` or `ETag`) but no browser-facing `Cache-Control` header. This prevents browsers from applying RFC 9111 §4.2.2 heuristic freshness, which silently caches pages based on the validator's age and makes tag-based invalidation and redeployments ineffective for affected visitors.
