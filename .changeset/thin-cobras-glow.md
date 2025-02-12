---
'@astrojs/netlify': minor
---

Automatically configures Netlify Blobs storage when experimental session enabled

If the `experimental.session` flag is enabled when using the Netlify adapter, Astro will automatically configure the session storage using the Netlify Blobs driver. You can still manually configure the session storage if you need to use a different driver or want to customize the session storage configuration. 

See [the experimental session docs](https://docs.astro.build/en/reference/experimental-flags/sessions/) for more information on configuring session storage.
