---
'astro': patch
---

Makes `session.driver` optional in config schema, allowing adapters to provide default drivers

Adapters like Cloudflare, Netlify, and Node provide default session drivers, so users can now configure session options (like `ttl`) without explicitly specifying a driver.
