---
'@astrojs/node': minor
---

Automatically configures filesystem storage when experimental session enabled

If the `experimental.session` flag is enabled when using the Node adapter, Astro will automatically configure session storage using the filesystem driver. You can still manually configure session storage if you need to use a different driver or want to customize the session storage configuration.

See [the experimental session docs](https://docs.astro.build/en/reference/experimental-flags/sessions/) for more information on configuring session storage.
