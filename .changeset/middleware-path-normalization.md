---
"astro": "patch"
---

Fix middleware pathname matching by normalizing URL-encoded paths

Middleware now receives normalized pathname values, ensuring that encoded paths like `/%61dmin` are properly decoded to `/admin` before middleware checks. This prevents potential security issues where middleware checks might be bypassed through URL encoding.
