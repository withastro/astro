---
'@astrojs/cloudflare': minor
---

Add support for Preview deployments (currently in private beta)

Non-inheritable bindings set internally by the Cloudflare adapter are now also set in the `previews` section of the config so that they are inherited by Preview deployments.
