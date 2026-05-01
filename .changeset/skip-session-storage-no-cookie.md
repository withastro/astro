---
'astro': patch
---

Skips session storage reads when no session cookie is present. Previously, calling `session.get()` on a request without a session cookie would initialize the storage driver and make a read that was guaranteed to miss. On network-backed drivers this added latency and resource usage to every anonymous request.
