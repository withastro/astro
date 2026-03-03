---
"astro": patch
---

Fixes the CSRF origin check middleware to enforce origin validation on Astro Action endpoints regardless of the request `Content-Type`. Both RPC-style (`/_actions/*`) and form-style (`?_action=`) action endpoints are now covered. The origin check for non-action endpoints is unchanged.
