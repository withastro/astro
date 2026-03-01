---
"@astrojs/cloudflare": major
---

Changes the default image service from `compile` to `cloudflare-binding`. Image services options that resulted in broken images in development due to Node JS incompatiblities have now been updated to use the noop passthrough image service in dev mode. - ([Cloudflare v13 and Astro6 upgrade guidance](https://v6.docs.astro.build/en/guides/integrations-guide/cloudflare/#changed-imageservice-default))
