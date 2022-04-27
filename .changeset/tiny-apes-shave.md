---
'@astrojs/vercel': minor
---


**Vercel Adapter v0.2**

- Updated to Build Output API (v3)
  - Make sure to rename the `ENABLE_FILE_SYSTEM_API` enviroment variable to `ENABLE_VC_BUILD`.
  - The output folder changed from `.output` to `.vercel/output`.
- You can now deploy to the `edge`! See the README for more info.
- `trailingSlash` redirects works without a `vercel.json` file: just configure them inside your `astro.config.mjs`
