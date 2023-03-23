---
'@astrojs/image': patch
---

Use base64 encoded modules for Squoosh integration

This moves `@astrojs/image` to use base64 encoded versions of the Squoosh wasm modules. This is in order to prevent breakage in SSR environments where your files are moved around. This will fix usage of the integration in Netlify.
