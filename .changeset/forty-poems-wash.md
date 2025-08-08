---
'@astrojs/cloudflare': patch
---

Refactors the internal solution which powers Astro Sessions when running local development with ˋastro devˋ.

The adapter now utilizes Cloudflare's local support for Cloudflare KV. This internal change is a drop-in replacement and does not require any change to your projectct code.

However, you now have the ability to connect to the remote Cloudflare KV Namespace if desired and use production data during local development.
