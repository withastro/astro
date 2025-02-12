---
'astro': minor
---

Adds support for adapters auto-configuring experimental session storage drivers.  

Adapters can now configure a default session storage driver when the `experimental.session` flag is enabled. If a hosting platform has a storage primitive that can be used for session storage, the adapter can automatically configure the session storage using that driver. This allows Astro to provide a more seamless experience for users who want to use sessions without needing to manually configure the session storage.
